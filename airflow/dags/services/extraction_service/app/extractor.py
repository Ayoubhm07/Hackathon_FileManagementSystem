"""
Entity extractor — combines YOLOv8 region detection (when a model is loaded)
with regex patterns and spaCy NER to extract structured fields from documents.

Priority order per field:
  1. YOLO-guided zone → targeted OCR (highest precision)
  2. spaCy NER
  3. Regex fallback (always available)
"""
from __future__ import annotations

import logging
import re
from datetime import date, datetime
from typing import Optional

from shared.schemas import (
    BoundingBox,
    EntityType,
    ExtractionResult,
    ExtractionSource,
    ExtractedEntity,
    RawFields,
)
from .yolo_detector import YOLODocumentDetector

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Regex patterns for French administrative documents
# ---------------------------------------------------------------------------

_SIRET_RE = re.compile(r"\b(\d{3}[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{5})\b")
_SIREN_RE = re.compile(r"\b(\d{3}[\s\-]?\d{3}[\s\-]?\d{3})\b")
_TVA_FR_RE = re.compile(r"\bFR[\s]?[0-9A-Z]{2}[\s]?\d{9}\b", re.IGNORECASE)
_IBAN_RE = re.compile(r"\b[A-Z]{2}\d{2}[\s]?[0-9A-Z]{4}[\s]?[0-9A-Z]{4}[\s]?[0-9A-Z]{4}(?:[\s]?[0-9A-Z]{1,4})*\b")
_BIC_RE = re.compile(r"\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b")
_AMOUNT_RE = re.compile(
    r"(?:montant|total|ht|ttc|tva)[^\d]*([0-9]+[\s]?[0-9]*(?:[,\.]\d{1,2})?)\s*(?:EUR|€)?",
    re.IGNORECASE,
)
_AMOUNT_PLAIN_RE = re.compile(r"\b(\d{1,6}(?:[,\.]\d{2}))\s*(?:EUR|€)\b")
_DATE_RE = re.compile(
    r"\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b"
    r"|(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})",
    re.IGNORECASE,
)

_FR_MONTHS = {
    "janvier": 1, "février": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12,
}


def _clean_digits(s: str) -> str:
    return re.sub(r"[\s\-]", "", s)


def _parse_fr_date(match: re.Match) -> Optional[date]:
    try:
        if match.group(4):  # "12 janvier 2024"
            day = int(match.group(4))
            month = _FR_MONTHS[match.group(5).lower()]
            year = int(match.group(6))
        else:
            day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
            if year < 100:
                year += 2000
        return date(year, month, day)
    except (ValueError, KeyError):
        return None


def _parse_amount(raw: str) -> Optional[float]:
    try:
        return float(raw.replace(" ", "").replace(",", "."))
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Extractor
# ---------------------------------------------------------------------------

class DocumentExtractor:
    """
    Main extraction engine.  Stateless — safe to reuse across requests.
    Instantiate once at startup (YOLO model load is expensive).
    """

    def __init__(self, detector: YOLODocumentDetector, spacy_model: str = "fr_core_news_md"):
        self.detector = detector
        self._nlp = None
        self._spacy_model = spacy_model

    def _get_nlp(self):
        if self._nlp is None:
            try:
                import spacy
                self._nlp = spacy.load(self._spacy_model)
            except (ImportError, OSError) as exc:
                logger.warning("spaCy model '%s' not available: %s", self._spacy_model, exc)
                self._nlp = False  # sentinel — don't retry
        return self._nlp if self._nlp else None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract(
        self,
        document_id: str,
        document_type,
        ocr_text: str,
        image_path: Optional[str] = None,
    ) -> ExtractionResult:
        entities: list[ExtractedEntity] = []

        # 1. YOLO detections (bounding boxes)
        yolo_boxes: list[dict] = []
        if image_path and self.detector.enabled:
            yolo_boxes = self.detector.detect(image_path)
            entities.extend(self._entities_from_yolo(yolo_boxes))

        # 2. spaCy NER on OCR text
        entities.extend(self._entities_from_spacy(ocr_text))

        # 3. Regex on OCR text (fills in any remaining gaps)
        entities.extend(self._entities_from_regex(ocr_text, yolo_boxes=yolo_boxes))

        # 4. Deduplicate: keep highest-confidence entity per type
        entities = self._deduplicate(entities)

        raw = self._to_raw_fields(entities)

        return ExtractionResult(
            document_id=document_id,
            document_type=document_type,
            entities=entities,
            raw_fields=raw,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _entities_from_yolo(self, boxes: list[dict]) -> list[ExtractedEntity]:
        """
        Convert YOLO detections to pre-typed entities.
        The actual OCR value is extracted at inference time when the image is
        cropped; here we emit placeholder entities that carry the bounding box
        so downstream can enrich them if needed.

        This stub maps known classes to the closest EntityType.
        """
        from shared.schemas import EntityType as ET

        CLASS_TO_ENTITY = {
            "siret_zone": ET.SIRET,
            "tva_zone": ET.TVA,
            "amount_block": ET.MONTANT_TTC,
            "iban_zone": ET.IBAN,
        }
        result: list[ExtractedEntity] = []
        for box in boxes:
            et = CLASS_TO_ENTITY.get(box["field_class"])
            if et is None:
                continue
            result.append(
                ExtractedEntity(
                    entity_type=et,
                    value="",  # will be filled by OCR crop if image available
                    confidence=box["confidence"] * 0.8,  # penalise until confirmed
                    source=ExtractionSource.YOLO_BOX,
                    bounding_box=BoundingBox(
                        x1=box["bbox"][0],
                        y1=box["bbox"][1],
                        x2=box["bbox"][2],
                        y2=box["bbox"][3],
                        label=box["field_class"],
                    ),
                )
            )
        return result

    def _entities_from_spacy(self, text: str) -> list[ExtractedEntity]:
        nlp = self._get_nlp()
        if nlp is None:
            return []
        result: list[ExtractedEntity] = []
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ == "ORG":
                result.append(
                    ExtractedEntity(
                        entity_type=EntityType.COMPANY_NAME,
                        value=ent.text,
                        normalized_value=ent.text.strip().upper(),
                        confidence=0.75,
                        source=ExtractionSource.SPACY,
                    )
                )
            elif ent.label_ in ("LOC", "GPE"):
                result.append(
                    ExtractedEntity(
                        entity_type=EntityType.ADDRESS,
                        value=ent.text,
                        confidence=0.65,
                        source=ExtractionSource.SPACY,
                    )
                )
        return result

    def _entities_from_regex(
        self, text: str, yolo_boxes: Optional[list[dict]] = None
    ) -> list[ExtractedEntity]:
        result: list[ExtractedEntity] = []

        # SIRET (14 digits) — must match before SIREN (9 digits)
        for m in _SIRET_RE.finditer(text):
            clean = _clean_digits(m.group(1))
            if len(clean) == 14:
                result.append(
                    ExtractedEntity(
                        entity_type=EntityType.SIRET,
                        value=m.group(1),
                        normalized_value=clean,
                        confidence=0.90,
                        source=ExtractionSource.REGEX,
                    )
                )

        # SIREN (from SIRET or standalone 9-digit block)
        for m in _SIREN_RE.finditer(text):
            clean = _clean_digits(m.group(1))
            if len(clean) == 9:
                # avoid duplicating the SIREN already embedded in a SIRET match
                already_siret = any(
                    e.entity_type == EntityType.SIRET
                    and e.normalized_value
                    and e.normalized_value.startswith(clean)
                    for e in result
                )
                if not already_siret:
                    result.append(
                        ExtractedEntity(
                            entity_type=EntityType.SIREN,
                            value=m.group(1),
                            normalized_value=clean,
                            confidence=0.80,
                            source=ExtractionSource.REGEX,
                        )
                    )

        # TVA intracommunautaire
        for m in _TVA_FR_RE.finditer(text):
            result.append(
                ExtractedEntity(
                    entity_type=EntityType.TVA,
                    value=m.group(0),
                    normalized_value=_clean_digits(m.group(0)).upper(),
                    confidence=0.88,
                    source=ExtractionSource.REGEX,
                )
            )

        # Amounts — labelled first, then plain €
        amounts_found: dict[EntityType, float] = {}
        keywords = {
            "ht": EntityType.MONTANT_HT,
            "hors taxe": EntityType.MONTANT_HT,
            "ttc": EntityType.MONTANT_TTC,
            "toutes taxes": EntityType.MONTANT_TTC,
            "tva": EntityType.MONTANT_TVA,
        }
        for kw, et in keywords.items():
            pattern = re.compile(
                rf"(?:{re.escape(kw)})[^\d]{{0,20}}([0-9]{{1,6}}(?:[,\.]\d{{2}})?)\s*(?:EUR|€)?",
                re.IGNORECASE,
            )
            m = pattern.search(text)
            if m:
                val = _parse_amount(m.group(1))
                if val is not None and et not in amounts_found:
                    amounts_found[et] = val
                    result.append(
                        ExtractedEntity(
                            entity_type=et,
                            value=m.group(1),
                            normalized_value=str(val),
                            confidence=0.85,
                            source=ExtractionSource.REGEX,
                        )
                    )

        # Dates
        dates_found: list[date] = []
        for m in _DATE_RE.finditer(text):
            d = _parse_fr_date(m)
            if d:
                dates_found.append(d)
        dates_found = sorted(set(dates_found))
        if dates_found:
            result.append(
                ExtractedEntity(
                    entity_type=EntityType.INVOICE_DATE,
                    value=str(dates_found[0]),
                    normalized_value=str(dates_found[0]),
                    confidence=0.80,
                    source=ExtractionSource.REGEX,
                )
            )
        if len(dates_found) > 1:
            result.append(
                ExtractedEntity(
                    entity_type=EntityType.EXPIRY_DATE,
                    value=str(dates_found[-1]),
                    normalized_value=str(dates_found[-1]),
                    confidence=0.75,
                    source=ExtractionSource.REGEX,
                )
            )

        # IBAN
        for m in _IBAN_RE.finditer(text):
            iban = re.sub(r"\s", "", m.group(0)).upper()
            if 15 <= len(iban) <= 34:
                result.append(
                    ExtractedEntity(
                        entity_type=EntityType.IBAN,
                        value=m.group(0),
                        normalized_value=iban,
                        confidence=0.88,
                        source=ExtractionSource.REGEX,
                    )
                )
                break  # one IBAN per document

        # BIC
        for m in _BIC_RE.finditer(text):
            result.append(
                ExtractedEntity(
                    entity_type=EntityType.BIC,
                    value=m.group(0),
                    normalized_value=m.group(0).upper(),
                    confidence=0.82,
                    source=ExtractionSource.REGEX,
                )
            )
            break

        return result

    def _deduplicate(self, entities: list[ExtractedEntity]) -> list[ExtractedEntity]:
        """Keep the highest-confidence entity per EntityType."""
        best: dict[EntityType, ExtractedEntity] = {}
        for e in entities:
            existing = best.get(e.entity_type)
            if existing is None or e.confidence > existing.confidence:
                best[e.entity_type] = e
        return list(best.values())

    def _to_raw_fields(self, entities: list[ExtractedEntity]) -> RawFields:
        lookup: dict[EntityType, str] = {
            e.entity_type: (e.normalized_value or e.value) for e in entities
        }

        def _amount(et: EntityType) -> Optional[float]:
            v = lookup.get(et)
            return _parse_amount(v) if v else None

        def _date(et: EntityType) -> Optional[date]:
            v = lookup.get(et)
            if not v:
                return None
            try:
                return date.fromisoformat(v)
            except ValueError:
                return None

        return RawFields(
            siret=lookup.get(EntityType.SIRET),
            siren=lookup.get(EntityType.SIREN) or (
                lookup.get(EntityType.SIRET, "")[:9] if lookup.get(EntityType.SIRET) else None
            ),
            tva_number=lookup.get(EntityType.TVA),
            montant_ht=_amount(EntityType.MONTANT_HT),
            montant_ttc=_amount(EntityType.MONTANT_TTC),
            montant_tva=_amount(EntityType.MONTANT_TVA),
            invoice_date=_date(EntityType.INVOICE_DATE),
            expiry_date=_date(EntityType.EXPIRY_DATE),
            company_name=lookup.get(EntityType.COMPANY_NAME),
            iban=lookup.get(EntityType.IBAN),
            bic=lookup.get(EntityType.BIC),
            address=lookup.get(EntityType.ADDRESS),
        )
