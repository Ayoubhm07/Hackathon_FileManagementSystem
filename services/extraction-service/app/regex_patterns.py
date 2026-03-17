"""
Compiled regex patterns for French administrative document entity extraction.
"""
import re

# SIRET: 14 digits, optionally space-separated in groups of 3/5
SIRET = re.compile(r"\b(\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5})\b")

# SIREN: 9 digits
SIREN = re.compile(r"\b(\d{3}[\s.]?\d{3}[\s.]?\d{3})\b")

# TVA intracommunautaire: FR + 2 alphanum + 9 digits
TVA = re.compile(r"\bFR\s*([A-Z0-9]{2})\s*(\d{3})\s*(\d{3})\s*(\d{3})\b", re.IGNORECASE)

# French IBAN: FR + 2 digits + 23 alphanumeric (spaces allowed)
IBAN = re.compile(r"\bFR\s*\d{2}(?:\s*[A-Z0-9]{4}){5}\s*[A-Z0-9]{3}\b", re.IGNORECASE)

# BIC/SWIFT: 8 or 11 chars (4 letters + 2 letters + 2 alphanums + optional 3)
BIC = re.compile(r"\b([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b")

# Euro amounts: optional currency symbol, digits with comma/dot separator
AMOUNT = re.compile(r"(?:€\s*)?(\d{1,3}(?:[\s.]\d{3})*(?:[,\.]\d{2}))\s*(?:€|EUR)?")

# Invoice number: common prefixes in French documents
INVOICE_NUMBER = re.compile(
    r"(?:N°|Numéro|N\s*°|Ref\.?|Facture\s+N°?|Devis\s+N°?)\s*:?\s*([A-Z0-9\-\/]{4,20})",
    re.IGNORECASE,
)

# Date patterns: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
DATE = re.compile(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b")

# ISO date: YYYY-MM-DD
ISO_DATE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")


def normalize_siret(raw: str) -> str:
    return re.sub(r"[\s.]", "", raw)


def normalize_iban(raw: str) -> str:
    return re.sub(r"\s", "", raw).upper()


def normalize_amount(raw: str) -> float:
    cleaned = re.sub(r"[\s]", "", raw).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0
