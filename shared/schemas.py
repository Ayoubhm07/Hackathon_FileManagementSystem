"""
Shared Pydantic schemas — data contract between services and consumers (frontend, CRM).
Do NOT import service-specific logic here.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class DocumentType(str, Enum):
    INVOICE = "invoice"
    QUOTE = "quote"
    KBIS = "kbis"
    URSSAF = "urssaf"
    RIB = "rib"
    SIRET_ATTESTATION = "siret_attestation"
    UNKNOWN = "unknown"


class EntityType(str, Enum):
    SIRET = "SIRET"
    SIREN = "SIREN"
    TVA = "TVA"
    MONTANT_HT = "MONTANT_HT"
    MONTANT_TTC = "MONTANT_TTC"
    MONTANT_TVA = "MONTANT_TVA"
    INVOICE_DATE = "INVOICE_DATE"
    EXPIRY_DATE = "EXPIRY_DATE"
    COMPANY_NAME = "COMPANY_NAME"
    IBAN = "IBAN"
    BIC = "BIC"
    ADDRESS = "ADDRESS"


class CheckStatus(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    SKIP = "skip"       # field absent in document
    ERROR = "error"     # external API unreachable


class ExtractionSource(str, Enum):
    REGEX = "regex"
    SPACY = "spacy"
    YOLO_BOX = "yolo+ocr"


# ---------------------------------------------------------------------------
# Extraction schemas
# ---------------------------------------------------------------------------

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    label: str


class ExtractedEntity(BaseModel):
    entity_type: EntityType
    value: str
    normalized_value: Optional[str] = None   # cleaned, canonical form
    confidence: float = Field(ge=0.0, le=1.0)
    source: ExtractionSource
    bounding_box: Optional[BoundingBox] = None


class RawFields(BaseModel):
    """Flat normalised fields — primary consumer view for frontend/CRM."""
    siret: Optional[str] = None
    siren: Optional[str] = None
    tva_number: Optional[str] = None          # e.g. FR48123456789
    montant_ht: Optional[float] = None
    montant_ttc: Optional[float] = None
    montant_tva: Optional[float] = None
    invoice_date: Optional[date] = None
    expiry_date: Optional[date] = None
    company_name: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    address: Optional[str] = None


class ExtractionRequest(BaseModel):
    document_id: str
    document_type: DocumentType
    ocr_text: str
    image_path: Optional[str] = None          # local path for YOLO inference


class ExtractionResult(BaseModel):
    document_id: str
    document_type: DocumentType
    entities: list[ExtractedEntity]
    raw_fields: RawFields
    extracted_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Validation schemas
# ---------------------------------------------------------------------------

class ValidationCheck(BaseModel):
    status: CheckStatus
    detail: Optional[str] = None


class CompanyInfo(BaseModel):
    """Enriched company data returned by the INSEE SIRENE API."""
    siren: str
    siret: str
    denomination: str
    address: str
    activity_code: Optional[str] = None       # NAF/APE
    activity_label: Optional[str] = None
    legal_form: Optional[str] = None
    is_active: bool
    closed_at: Optional[date] = None


class ValidationChecks(BaseModel):
    siret_format: ValidationCheck
    siret_luhn: ValidationCheck
    siret_insee: ValidationCheck              # external call to INSEE
    tva_format: ValidationCheck
    tva_coherence: ValidationCheck            # TVA must derive from SIREN
    amounts_coherence: ValidationCheck        # TTC = HT + TVA ±0.02
    invoice_date_valid: ValidationCheck
    expiry_date_valid: ValidationCheck


class ValidationError(BaseModel):
    code: str
    field: str
    message: str
    severity: str = "error"                  # "error" | "warning"


class ValidationResult(BaseModel):
    """
    Top-level object stored in MongoDB and exposed to the frontend/CRM.
    Includes both validation outcome and enriched company data from INSEE.
    """
    document_id: str
    document_type: DocumentType
    is_valid: bool
    overall_score: float = Field(ge=0.0, le=1.0, description="Ratio of passing checks")
    checks: ValidationChecks
    errors: list[ValidationError]
    warnings: list[str]
    enriched_company: Optional[CompanyInfo] = None   # from INSEE, if SIRET found
    raw_fields: RawFields                             # pass-through for frontend
    validated_at: datetime = Field(default_factory=datetime.utcnow)
