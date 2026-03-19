"""
Entity extraction combining spaCy NER and regex patterns.
Returns a dict of extracted fields keyed by document type.
"""
from typing import Any, Optional
import re
import spacy
from app.config import settings
from app.logger import logger
from app import regex_patterns as rx


_nlp: Optional[spacy.language.Language] = None


def load_nlp() -> spacy.language.Language:
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load(settings.spacy_model)
            logger.info("spacy_model_loaded", model=settings.spacy_model)
        except OSError:
            logger.warning("spacy_model_not_found_using_blank", model=settings.spacy_model)
            _nlp = spacy.blank("fr")
    return _nlp


def _find_first(pattern: re.Pattern, text: str) -> Optional[str]:
    m = pattern.search(text)
    return m.group(0) if m else None


def _find_all(pattern: re.Pattern, text: str) -> list[str]:
    return pattern.findall(text)


def _extract_amounts(text: str) -> dict[str, Optional[float]]:
    """
    Attempt to parse HT, TVA, TTC amounts from lines containing keywords.
    """
    result: dict[str, Optional[float]] = {"amountHT": None, "amountTVA": None, "amountTTC": None}

    for line in text.split("\n"):
        line_lower = line.lower()
        amounts = [rx.normalize_amount(m.group(0)) for m in rx.AMOUNT.finditer(line)]
        if not amounts:
            continue
        val = amounts[-1]  # take the last amount on the line as the value

        if any(kw in line_lower for kw in ["montant ht", "hors taxe", "ht :"]):
            result["amountHT"] = val
        elif any(kw in line_lower for kw in ["montant tva", "tva :"]):
            result["amountTVA"] = val
        elif any(kw in line_lower for kw in ["montant ttc", "toutes taxes", "ttc :"]):
            result["amountTTC"] = val

    return result


def extract(text: str, document_type: str) -> dict[str, Any]:
    """Extract structured entities from OCR text based on document type."""
    nlp = load_nlp()
    doc = nlp(text[:100_000])  # cap at 100k chars for performance

    # NER-based entities (company names, locations)
    ner_orgs = [ent.text for ent in doc.ents if ent.label_ in ("ORG", "PER")]
    ner_locs = [ent.text for ent in doc.ents if ent.label_ in ("LOC", "GPE")]

    entities: dict[str, Any] = {
        "documentType": document_type,
        "rawEntities": {"orgs": ner_orgs[:5], "locations": ner_locs[:3]},
    }

    # SIRET / SIREN
    siret_match = rx.SIRET.search(text)
    if siret_match:
        entities["siret"] = rx.normalize_siret(siret_match.group(1))
        entities["siren"] = entities["siret"][:9]

    # TVA
    tva_match = rx.TVA.search(text)
    if tva_match:
        entities["tvaNumber"] = tva_match.group(0).replace(" ", "").upper()

    # Company name from NER (first ORG entity)
    if ner_orgs:
        entities["companyName"] = ner_orgs[0]

    # Address from NER (first LOC)
    if ner_locs:
        entities["address"] = ner_locs[0]

    # Document-type-specific extraction
    if document_type in ("FACTURE", "DEVIS"):
        _extract_invoice_fields(text, entities)

    elif document_type == "RIB":
        _extract_rib_fields(text, entities)

    elif document_type == "URSSAF":
        _extract_urssaf_fields(text, entities)

    elif document_type == "KBIS":
        _extract_kbis_fields(text, entities)

    elif document_type == "SIRET_ATTESTATION":
        pass  # SIRET already extracted above

    return entities


def _extract_invoice_fields(text: str, entities: dict[str, Any]) -> None:
    invoice_num = _find_first(rx.INVOICE_NUMBER, text)
    if invoice_num:
        entities["invoiceNumber"] = re.sub(r"[^\w\-\/]", "", invoice_num.split(":")[-1].strip())

    dates = rx.DATE.findall(text)
    if dates:
        d, m, y = dates[0]
        entities["invoiceDate"] = f"{y}-{m.zfill(2)}-{d.zfill(2)}"
        if len(dates) > 1:
            d2, m2, y2 = dates[1]
            entities["dueDate"] = f"{y2}-{m2.zfill(2)}-{d2.zfill(2)}"

    amounts = _extract_amounts(text)
    entities.update({k: v for k, v in amounts.items() if v is not None})
    entities["currency"] = "EUR"

    # Detect TVA rate from lines like "TVA 20%"
    rate_match = re.search(r"TVA\s+(\d{1,2}(?:[,\.]\d+)?)\s*%", text, re.IGNORECASE)
    if rate_match:
        entities["tvaRate"] = float(rate_match.group(1).replace(",", "."))


def _extract_rib_fields(text: str, entities: dict[str, Any]) -> None:
    iban_match = rx.IBAN.search(text)
    if iban_match:
        entities["iban"] = rx.normalize_iban(iban_match.group(0))

    bic_match = rx.BIC.search(text)
    if bic_match:
        entities["bic"] = bic_match.group(1).upper()

    # Bank name heuristic: line containing "Banque" or "Crédit"
    for line in text.split("\n"):
        if any(kw in line for kw in ["Banque", "Crédit", "Caisse", "Société Générale", "BNP", "LCL"]):
            entities["bankName"] = line.strip()[:80]
            break


def _extract_urssaf_fields(text: str, entities: dict[str, Any]) -> None:
    # Period: look for "Période du DD/MM/YYYY au DD/MM/YYYY"
    period_match = re.search(
        r"[Pp]ériode\s+(?:du\s+)?(\d{1,2}/\d{1,2}/\d{4})(?:\s+au\s+(\d{1,2}/\d{1,2}/\d{4}))?",
        text,
    )
    if period_match:
        entities["urssafPeriod"] = period_match.group(0).strip()

    # Expiration: look for "valable jusqu'au" or "expire le"
    exp_match = re.search(
        r"(?:valable jusqu(?:['`])?au|expire le|date limite)\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4})",
        text,
        re.IGNORECASE,
    )
    if exp_match:
        raw_date = exp_match.group(1)
        parts = re.split(r"[/\-.]", raw_date)
        if len(parts) == 3:
            entities["urssafExpirationDate"] = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"

    # Status
    if re.search(r"à jour|réguli[eè]re?|conforme", text, re.IGNORECASE):
        entities["urssafStatus"] = "VALID"
    elif re.search(r"irréguli[eè]re?|défaut|impayé", text, re.IGNORECASE):
        entities["urssafStatus"] = "INVALID"


def _extract_kbis_fields(text: str, entities: dict[str, Any]) -> None:
    # RCS number — handles "RCS Paris B 123 456 789" and "RCS Paris 123 456 789"
    rcs_match = re.search(
        r"RCS\s+[A-Za-zÀ-ÿ\s\-]+?\s+(?:[A-Z]\s+)?(\d{3}[\s]?\d{3}[\s]?\d{3})\b",
        text,
    )
    if rcs_match:
        entities["registrationNumber"] = re.sub(r"\s", "", rcs_match.group(1))

    # Court
    court_match = re.search(r"[Gg]reffe\s+(?:du\s+[Tt]ribunal\s+)?(?:de\s+)?([A-Z][a-z\-]+(?:\s+[A-Z][a-z\-]+)*)", text)
    if court_match:
        entities["registrationCourt"] = court_match.group(1).strip()

    # Legal form
    lf_match = re.search(
        r"(SAS|SARL|SA\b|SNC|EURL|SASU|SCI|SELARL|GIE|Association loi 1901)",
        text,
        re.IGNORECASE,
    )
    if lf_match:
        entities["legalForm"] = lf_match.group(1).upper()

    # Capital
    cap_match = re.search(r"[Cc]apital\s+(?:social\s+)?(?:de\s+)?([\d\s.,]+)\s*(?:€|EUR|euros?)", text)
    if cap_match:
        entities["shareCapital"] = rx.normalize_amount(cap_match.group(1))

    # Incorporation date
    dates = rx.DATE.findall(text)
    if dates:
        d, m, y = dates[0]
        entities["incorporationDate"] = f"{y}-{m.zfill(2)}-{d.zfill(2)}"
