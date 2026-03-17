"""
TVA intracommunautaire validators.

French TVA format: FR + 2 chars (digits or letters) + 9-digit SIREN.
The 2-char key is computed as: (12 + 3 × (SIREN mod 97)) mod 97.
"""
from __future__ import annotations

import re
from typing import Optional

from shared.schemas import CheckStatus, ValidationCheck

_TVA_RE = re.compile(r"^FR([0-9A-Z]{2})(\d{9})$", re.IGNORECASE)


def _compute_tva_key(siren: str) -> str:
    key = (12 + 3 * (int(siren) % 97)) % 97
    return str(key).zfill(2)


def validate_tva_format(tva: Optional[str]) -> ValidationCheck:
    if not tva:
        return ValidationCheck(status=CheckStatus.SKIP, detail="N° TVA absent")
    clean = re.sub(r"[\s\-\.]", "", tva).upper()
    if not _TVA_RE.match(clean):
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"Format TVA invalide: '{tva}'. Attendu: FR##SIREN",
        )
    return ValidationCheck(status=CheckStatus.PASS)


def validate_tva_coherence(tva: Optional[str], siret: Optional[str]) -> ValidationCheck:
    """Check that the SIREN embedded in the TVA matches the document's SIRET/SIREN."""
    if not tva:
        return ValidationCheck(status=CheckStatus.SKIP, detail="N° TVA absent")
    if not siret:
        return ValidationCheck(status=CheckStatus.SKIP, detail="SIRET absent — cannot cross-check TVA")

    clean_tva = re.sub(r"[\s\-\.]", "", tva).upper()
    clean_siret = re.sub(r"[\s\-]", "", siret)
    m = _TVA_RE.match(clean_tva)
    if not m:
        return ValidationCheck(status=CheckStatus.SKIP, detail="TVA format invalid — skip coherence")

    tva_key = m.group(1)
    tva_siren = m.group(2)
    doc_siren = clean_siret[:9]

    if tva_siren != doc_siren:
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"SIREN dans TVA ({tva_siren}) ≠ SIREN du document ({doc_siren})",
        )

    expected_key = _compute_tva_key(doc_siren)
    if tva_key != expected_key:
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"Clé TVA calculée ({expected_key}) ≠ clé fournie ({tva_key})",
        )

    return ValidationCheck(status=CheckStatus.PASS)
