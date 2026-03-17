"""
Tests for the Extraction Service.

Run:
    cd Hackathon_FileManagementSystem
    pip install pytest pydantic
    pytest tests/test_extractor.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path

# Make shared/ and services/ importable
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "services" / "extraction_service"))

import pytest
from shared.schemas import DocumentType, EntityType, ExtractionSource

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_extractor(yolo_model_path: str = ""):
    from app.yolo_detector import YOLODocumentDetector
    from app.extractor import DocumentExtractor

    detector = YOLODocumentDetector(model_path=yolo_model_path or None)
    return DocumentExtractor(detector=detector, spacy_model="fr_core_news_md")


def _read_fixture(name: str) -> str:
    return (ROOT / "tests" / "fixtures" / name).read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# SIRET / SIREN extraction
# ---------------------------------------------------------------------------

class TestSiretExtraction:
    def test_extracts_siret_from_invoice(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc001", DocumentType.INVOICE, text)
        siret = result.raw_fields.siret
        assert siret is not None, "Expected SIRET to be extracted"
        assert siret == "36252187900001", f"Expected normalised SIRET, got {siret}"

    def test_siren_derived_from_siret(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc002", DocumentType.INVOICE, text)
        assert result.raw_fields.siren == "362521879"  # first 9 digits of SIRET

    def test_siret_from_kbis(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_kbis.txt")
        result = extractor.extract("doc003", DocumentType.KBIS, text)
        assert result.raw_fields.siret == "36252187900034"


# ---------------------------------------------------------------------------
# TVA extraction
# ---------------------------------------------------------------------------

class TestTVAExtraction:
    def test_extracts_tva_number(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc010", DocumentType.INVOICE, text)
        assert result.raw_fields.tva_number is not None
        assert "FR00362521879" in result.raw_fields.tva_number.upper()


# ---------------------------------------------------------------------------
# Amount extraction
# ---------------------------------------------------------------------------

class TestAmountExtraction:
    def test_extracts_montant_ht(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc020", DocumentType.INVOICE, text)
        assert result.raw_fields.montant_ht == pytest.approx(5900.0, abs=1.0)

    def test_extracts_montant_ttc(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc021", DocumentType.INVOICE, text)
        assert result.raw_fields.montant_ttc == pytest.approx(7080.0, abs=1.0)


# ---------------------------------------------------------------------------
# Date extraction
# ---------------------------------------------------------------------------

class TestDateExtraction:
    def test_extracts_invoice_date(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc030", DocumentType.INVOICE, text)
        assert result.raw_fields.invoice_date is not None
        assert result.raw_fields.invoice_date.year == 2024

    def test_extracts_expiry_date(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc031", DocumentType.INVOICE, text)
        assert result.raw_fields.expiry_date is not None
        assert result.raw_fields.expiry_date > result.raw_fields.invoice_date


# ---------------------------------------------------------------------------
# IBAN extraction
# ---------------------------------------------------------------------------

class TestIBANExtraction:
    def test_extracts_iban(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc040", DocumentType.INVOICE, text)
        iban = result.raw_fields.iban
        assert iban is not None
        assert iban.startswith("FR76")

    def test_extracts_bic(self):
        extractor = _make_extractor()
        text = _read_fixture("sample_invoice.txt")
        result = extractor.extract("doc041", DocumentType.INVOICE, text)
        assert result.raw_fields.bic == "BNPAFRPP"


# ---------------------------------------------------------------------------
# YOLOv8 detector — unit test with synthetic annotations
# ---------------------------------------------------------------------------

class TestYOLODetector:
    def test_disabled_without_model(self):
        from app.yolo_detector import YOLODocumentDetector
        d = YOLODocumentDetector(model_path=None)
        assert not d.enabled
        assert d.detect("any_image.jpg") == []

    def test_disabled_with_missing_model_file(self):
        from app.yolo_detector import YOLODocumentDetector
        d = YOLODocumentDetector(model_path="/nonexistent/model.pt")
        assert not d.enabled

    def test_synthetic_annotations_pixel_conversion(self):
        """Verify that YOLO normalised coordinates → pixel coords are consistent."""
        from tests.fixtures.yolo_dataset import ANNOTATIONS, bbox_to_pixel

        ann = ANNOTATIONS[0]
        for box in ann["boxes"]:
            px = bbox_to_pixel(box, ann["width"], ann["height"])
            x1, y1, x2, y2 = px["bbox"]
            assert x1 < x2 and y1 < y2, "x1 must be < x2 and y1 < y2"
            assert 0 <= x1 and x2 <= ann["width"]
            assert 0 <= y1 and y2 <= ann["height"]

    def test_yolo_label_line_format(self):
        """Each label line must follow YOLO txt format."""
        from tests.fixtures.yolo_dataset import ANNOTATIONS, to_yolo_label_line

        for ann in ANNOTATIONS:
            for box in ann["boxes"]:
                line = to_yolo_label_line(box)
                parts = line.split()
                assert len(parts) == 5
                int(parts[0])          # class_id must be int
                for v in parts[1:]:
                    f = float(v)
                    assert 0.0 <= f <= 1.0, f"Coords must be normalised, got {f}"


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

class TestDeduplication:
    def test_deduplication_keeps_highest_confidence(self):
        extractor = _make_extractor()
        from shared.schemas import ExtractedEntity, ExtractionSource, EntityType

        entities = [
            ExtractedEntity(entity_type=EntityType.SIRET, value="36252187900034",
                            confidence=0.85, source=ExtractionSource.REGEX),
            ExtractedEntity(entity_type=EntityType.SIRET, value="36252187900034",
                            confidence=0.60, source=ExtractionSource.YOLO_BOX),
        ]
        dedup = extractor._deduplicate(entities)
        assert len(dedup) == 1
        assert dedup[0].confidence == 0.85
