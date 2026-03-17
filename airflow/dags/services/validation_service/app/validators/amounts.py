"""
Amount coherence validator.

Rule: montant_ttc ≈ montant_ht × (1 + tva_rate)
      OR montant_ttc ≈ montant_ht + montant_tva

Tolerance is ±0.02 EUR (rounding + OCR noise).
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from shared.schemas import CheckStatus, RawFields, ValidationCheck

_TOLERANCE = 0.02
_COMMON_TVA_RATES = (0.20, 0.10, 0.055, 0.021, 0.0)  # France standard rates


def validate_amounts_coherence(fields: RawFields) -> ValidationCheck:
    ht = fields.montant_ht
    ttc = fields.montant_ttc
    tva_amount = fields.montant_tva

    if ht is None or ttc is None:
        return ValidationCheck(
            status=CheckStatus.SKIP, detail="Montants HT et/ou TTC absents"
        )
    if ttc < ht:
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"TTC ({ttc}) < HT ({ht}) — incohérent",
        )

    # Check with explicit TVA amount
    if tva_amount is not None:
        computed_ttc = round(ht + tva_amount, 2)
        if abs(computed_ttc - ttc) <= _TOLERANCE:
            return ValidationCheck(status=CheckStatus.PASS)
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"HT ({ht}) + TVA ({tva_amount}) = {computed_ttc} ≠ TTC ({ttc})",
        )

    # Check with standard TVA rates when TVA amount not present
    for rate in _COMMON_TVA_RATES:
        computed = round(ht * (1 + rate), 2)
        if abs(computed - ttc) <= _TOLERANCE:
            return ValidationCheck(
                status=CheckStatus.PASS,
                detail=f"Cohérent avec taux TVA {int(rate*100)}%",
            )

    return ValidationCheck(
        status=CheckStatus.FAIL,
        detail=f"Impossible de réconcilier HT={ht} et TTC={ttc} avec les taux TVA standards",
    )


def validate_invoice_date(invoice_date: Optional[date]) -> ValidationCheck:
    if invoice_date is None:
        return ValidationCheck(status=CheckStatus.SKIP, detail="Date facture absente")
    today = date.today()
    if invoice_date > today:
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"Date facture {invoice_date} est dans le futur",
        )
    return ValidationCheck(status=CheckStatus.PASS)


def validate_expiry_date(expiry_date: Optional[date], invoice_date: Optional[date]) -> ValidationCheck:
    if expiry_date is None:
        return ValidationCheck(status=CheckStatus.SKIP, detail="Date d'expiration absente")
    if invoice_date and expiry_date < invoice_date:
        return ValidationCheck(
            status=CheckStatus.FAIL,
            detail=f"Date d'expiration {expiry_date} antérieure à la date de facture {invoice_date}",
        )
    return ValidationCheck(status=CheckStatus.PASS)
