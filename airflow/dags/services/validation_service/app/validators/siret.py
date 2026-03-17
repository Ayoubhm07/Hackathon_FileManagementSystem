"""
SIRET / SIREN validators.

Local checks (format + Luhn) are synchronous.
INSEE remote check is async and returns CheckStatus.ERROR if unreachable.
"""
from __future__ import annotations

import re
from typing import Optional

from shared.schemas import CheckStatus, ValidationCheck


_DIGITS_ONLY = re.compile(r"^\d+$")


# ---------------------------------------------------------------------------
# Luhn algorithm for SIREN / SIRET
# ---------------------------------------------------------------------------

def _luhn_check(number: str) -> bool:
    """
    INSEE uses a Luhn-variant (summing all digits after doubling odd positions
    from right).  Returns True when the checksum is divisible by 10.
    """
    digits = [int(d) for d in reversed(number)]
    total = 0
    for i, d in enumerate(digits):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


# ---------------------------------------------------------------------------
# Public validators
# ---------------------------------------------------------------------------

def validate_siret_format(siret: Optional[str]) -> ValidationCheck:
    """Check that the SIRET is exactly 14 digits."""
    if not siret:
        return ValidationCheck(status=CheckStatus.SKIP, detail="SIRET absent")
    clean = re.sub(r"[\s\-]", "", siret)
    if not _DIGITS_ONLY.match(clean) or len(clean) != 14:
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"SIRET must be 14 digits, got '{clean}' ({len(clean)} chars)",
        )
    return ValidationCheck(status=CheckStatus.PASS)


def validate_siret_luhn(siret: Optional[str]) -> ValidationCheck:
    """Apply the Luhn checksum on SIRET digits."""
    if not siret:
        return ValidationCheck(status=CheckStatus.SKIP, detail="SIRET absent")
    clean = re.sub(r"[\s\-]", "", siret)
    if len(clean) != 14 or not _DIGITS_ONLY.match(clean):
        return ValidationCheck(status=CheckStatus.SKIP, detail="Invalid format — skip Luhn")
    if not _luhn_check(clean):
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"SIRET {clean} failed Luhn checksum",
        )
    return ValidationCheck(status=CheckStatus.PASS)


async def validate_siret_insee(siret: Optional[str]) -> tuple[ValidationCheck, object]:
    """
    Call the INSEE SIRENE API.
    Returns (ValidationCheck, Optional[CompanyInfo]).
    """
    from ..adapters.insee import lookup_siret  # local import to avoid circular

    if not siret:
        return ValidationCheck(status=CheckStatus.SKIP, detail="SIRET absent"), None

    clean = re.sub(r"[\s\-]", "", siret)
    if len(clean) != 14:
        return ValidationCheck(status=CheckStatus.SKIP, detail="Invalid format"), None

    company = await lookup_siret(clean)
    if company is None:
        # Distinguish "not found" from "unreachable"
        # lookup_siret returns None for both — we rely on the circuit breaker flag
        from ..adapters import insee as _insee_mod  # type: ignore[attr-defined]
        if _insee_mod._is_circuit_open():
            return (
                ValidationCheck(status=CheckStatus.ERROR, detail="INSEE API unreachable"),
                None,
            )
        return (
            ValidationCheck(
                status=CheckStatus.FAIL,
                detail=f"SIRET {clean} not found in INSEE SIRENE",
            ),
            None,
        )
    if not company.is_active:
        return (
            ValidationCheck(
                status=CheckStatus.FAIL,
                detail=f"Établissement {clean} is closed (état: fermé)",
            ),
            company,
        )
    return ValidationCheck(status=CheckStatus.PASS), company
