"""
Validation Service — FastAPI entry point.

POST /validate     → ValidationResult
GET  /health       → {"status": "ok"}
"""
import logging
import sys

from fastapi import FastAPI, HTTPException

sys.path.insert(0, "/app")

from shared.schemas import (
    CheckStatus,
    DocumentType,
    ExtractionResult,
    ValidationCheck,
    ValidationChecks,
    ValidationError,
    ValidationResult,
)
from .config import settings
from .validators.siret import (
    validate_siret_format,
    validate_siret_luhn,
    validate_siret_insee,
)
from .validators.tva import validate_tva_format, validate_tva_coherence
from .validators.amounts import (
    validate_amounts_coherence,
    validate_invoice_date,
    validate_expiry_date,
)

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Validation Service",
    description="Validates extracted document entities against local rules and the INSEE SIRENE API",
    version="1.0.0",
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/validate", response_model=ValidationResult)
async def validate(extraction: ExtractionResult) -> ValidationResult:
    fields = extraction.raw_fields
    errors: list[ValidationError] = []
    warnings: list[str] = []

    # ------------------------------------------------------------------
    # 1. Local format checks (sync)
    # ------------------------------------------------------------------
    siret_format = validate_siret_format(fields.siret)
    siret_luhn = validate_siret_luhn(fields.siret)
    tva_format = validate_tva_format(fields.tva_number)
    tva_coh = validate_tva_coherence(fields.tva_number, fields.siret)
    amounts_coh = validate_amounts_coherence(fields)
    inv_date = validate_invoice_date(fields.invoice_date)
    exp_date = validate_expiry_date(fields.expiry_date, fields.invoice_date)

    # ------------------------------------------------------------------
    # 2. External INSEE check (async, only if local format passes)
    # ------------------------------------------------------------------
    enriched_company = None
    if siret_format.status == CheckStatus.PASS and siret_luhn.status == CheckStatus.PASS:
        siret_insee_check, enriched_company = await validate_siret_insee(fields.siret)
    else:
        siret_insee_check = ValidationCheck(
            status=CheckStatus.SKIP,
            detail="Format/Luhn failed — skip INSEE lookup",
        )

    checks = ValidationChecks(
        siret_format=siret_format,
        siret_luhn=siret_luhn,
        siret_insee=siret_insee_check,
        tva_format=tva_format,
        tva_coherence=tva_coh,
        amounts_coherence=amounts_coh,
        invoice_date_valid=inv_date,
        expiry_date_valid=exp_date,
    )

    # ------------------------------------------------------------------
    # 3. Build errors list
    # ------------------------------------------------------------------
    _field_map = {
        "siret_format": ("siret", "FORMAT_ERR"),
        "siret_luhn": ("siret", "LUHN_ERR"),
        "siret_insee": ("siret", "INSEE_NOT_FOUND"),
        "tva_format": ("tva_number", "TVA_FORMAT_ERR"),
        "tva_coherence": ("tva_number", "TVA_COHERENCE_ERR"),
        "amounts_coherence": ("montant_ttc", "AMOUNTS_ERR"),
        "invoice_date_valid": ("invoice_date", "DATE_FUTURE_ERR"),
        "expiry_date_valid": ("expiry_date", "EXPIRY_ERR"),
    }
    for attr, (field_name, code) in _field_map.items():
        chk: ValidationCheck = getattr(checks, attr)
        if chk.status == CheckStatus.FAIL:
            errors.append(
                ValidationError(
                    code=code,
                    field=field_name,
                    message=chk.detail or code,
                    severity="error",
                )
            )
        elif chk.status == CheckStatus.ERROR:
            warnings.append(f"{attr}: {chk.detail} (service externe non disponible)")

    # Warn if company in document doesn't match INSEE denomination
    if enriched_company and fields.company_name:
        doc_name = fields.company_name.upper().strip()
        insee_name = enriched_company.denomination.upper().strip()
        # Rough similarity: INSEE name must contain doc name or vice-versa
        if doc_name not in insee_name and insee_name not in doc_name:
            warnings.append(
                f"Raison sociale document ('{fields.company_name}') "
                f"≠ INSEE ('{enriched_company.denomination}')"
            )

    # ------------------------------------------------------------------
    # 4. Overall score
    # ------------------------------------------------------------------
    all_checks = [
        siret_format, siret_luhn, siret_insee_check,
        tva_format, tva_coh, amounts_coh, inv_date, exp_date,
    ]
    active = [c for c in all_checks if c.status != CheckStatus.SKIP]
    passing = [c for c in active if c.status == CheckStatus.PASS]
    score = len(passing) / len(active) if active else 1.0

    return ValidationResult(
        document_id=extraction.document_id,
        document_type=extraction.document_type,
        is_valid=len(errors) == 0,
        overall_score=round(score, 3),
        checks=checks,
        errors=errors,
        warnings=warnings,
        enriched_company=enriched_company,
        raw_fields=fields,
    )
