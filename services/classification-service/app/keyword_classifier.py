"""
Keyword-based fallback classifier.
Returns the document type with the highest keyword match score.
"""
from typing import Optional

KEYWORD_MAP: dict[str, list[str]] = {
    "FACTURE": [
        "facture", "invoice", "numéro de facture", "date de facture", "montant ttc",
        "montant ht", "tva", "règlement", "échéance", "bon de commande",
    ],
    "DEVIS": [
        "devis", "estimation", "proposition commerciale", "offre de prix",
        "validité du devis", "acceptation", "bon pour accord",
    ],
    "KBIS": [
        "extrait kbis", "registre du commerce", "rcs", "greffe", "immatriculation",
        "capital social", "forme juridique", "siège social", "représentant légal",
    ],
    "URSSAF": [
        "urssaf", "cotisations sociales", "attestation de vigilance", "cotisant",
        "période de référence", "régularité", "contributions sociales",
    ],
    "RIB": [
        "relevé d'identité bancaire", "rib", "iban", "bic", "swift",
        "domiciliation bancaire", "numéro de compte", "code banque", "code guichet",
    ],
    "SIRET_ATTESTATION": [
        "attestation siret", "numéro siret", "siren", "insee", "établissement",
        "situation au répertoire", "avis de situation", "identifiant",
    ],
}


def classify_by_keywords(text: str) -> tuple[str, float]:
    """
    Returns (document_type, confidence_score).
    confidence_score is the fraction of matched keywords for the winning class.
    """
    text_lower = text.lower()
    scores: dict[str, int] = {}

    for doc_type, keywords in KEYWORD_MAP.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[doc_type] = score

    best_type = max(scores, key=lambda k: scores[k])
    best_score = scores[best_type]

    if best_score == 0:
        return "UNKNOWN", 0.0

    total = sum(scores.values())
    confidence = best_score / total if total > 0 else 0.0
    return best_type, round(confidence, 4)
