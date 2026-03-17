"""
Tests for the Validation Service.

Run:
    cd Hackathon_FileManagementSystem
    pytest tests/test_validators.py -v
"""
from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "services" / "validation_service"))

import pytest
from shared.schemas import RawFields


# ---------------------------------------------------------------------------
# SIRET format + Luhn
# ---------------------------------------------------------------------------

class TestSiretFormat:
    def setup_method(self):
        from app.validators.siret import validate_siret_format, validate_siret_luhn
        self.validate_format = validate_siret_format
        self.validate_luhn = validate_siret_luhn

    def test_valid_siret_passes_format(self):
        chk = self.validate_format("36252187900034")
        assert chk.status == "pass"

    def test_siret_with_spaces_passes(self):
        chk = self.validate_format("362 521 879 00034")
        assert chk.status == "pass"

    def test_too_short_fails(self):
        chk = self.validate_format("1234567890")
        assert chk.status == "fail"

    def test_non_digits_fail(self):
        chk = self.validate_format("362521879ABCDE")
        assert chk.status == "fail"

    def test_none_skipped(self):
        chk = self.validate_format(None)
        assert chk.status == "skip"

    def test_valid_siret_passes_luhn(self):
        # 36252187900001 passes Luhn (verified)
        chk = self.validate_luhn("36252187900001")
        assert chk.status == "pass"

    def test_invalid_luhn_fails(self):
        chk = self.validate_luhn("36252187900099")  # tampered last digits
        assert chk.status == "fail"


# ---------------------------------------------------------------------------
# TVA validators
# ---------------------------------------------------------------------------

class TestTVAValidators:
    def setup_method(self):
        from app.validators.tva import validate_tva_format, validate_tva_coherence
        self.validate_format = validate_tva_format
        self.validate_coherence = validate_tva_coherence

    def test_valid_tva_passes_format(self):
        chk = self.validate_format("FR69362521879")
        assert chk.status == "pass"

    def test_tva_with_spaces_passes(self):
        chk = self.validate_format("FR 69 362521879")
        assert chk.status == "pass"

    def test_invalid_tva_fails_format(self):
        chk = self.validate_format("FR1234")
        assert chk.status == "fail"

    def test_none_tva_skipped(self):
        chk = self.validate_format(None)
        assert chk.status == "skip"

    def test_coherent_tva_siret_passes(self):
        # TVA key for SIREN 362521879 is '00'
        chk = self.validate_coherence("FR00362521879", "36252187900001")
        assert chk.status == "pass"

    def test_mismatched_siren_fails(self):
        chk = self.validate_coherence("FR69362521879", "12345678900012")
        assert chk.status == "fail"
        assert "SIREN" in chk.detail

    def test_wrong_key_fails(self):
        # Key 69 is wrong for SIREN 362521879 (correct key is '00')
        chk = self.validate_coherence("FR69362521879", "36252187900001")
        assert chk.status == "fail"


# ---------------------------------------------------------------------------
# Amount coherence
# ---------------------------------------------------------------------------

class TestAmountCoherence:
    def setup_method(self):
        from app.validators.amounts import validate_amounts_coherence
        self.validate_amounts = validate_amounts_coherence

    def test_valid_amounts_with_explicit_tva(self):
        fields = RawFields(montant_ht=5900.0, montant_ttc=7080.0, montant_tva=1180.0)
        chk = self.validate_amounts(fields)
        assert chk.status == "pass"

    def test_valid_amounts_inferred_20pct(self):
        fields = RawFields(montant_ht=100.0, montant_ttc=120.0)
        chk = self.validate_amounts(fields)
        assert chk.status == "pass"

    def test_valid_amounts_10pct(self):
        fields = RawFields(montant_ht=100.0, montant_ttc=110.0)
        chk = self.validate_amounts(fields)
        assert chk.status == "pass"

    def test_incoherent_amounts_fail(self):
        fields = RawFields(montant_ht=100.0, montant_ttc=999.0)
        chk = self.validate_amounts(fields)
        assert chk.status == "fail"

    def test_ttc_less_than_ht_fails(self):
        fields = RawFields(montant_ht=500.0, montant_ttc=400.0)
        chk = self.validate_amounts(fields)
        assert chk.status == "fail"

    def test_missing_amounts_skipped(self):
        fields = RawFields()
        chk = self.validate_amounts(fields)
        assert chk.status == "skip"


# ---------------------------------------------------------------------------
# Date validators
# ---------------------------------------------------------------------------

class TestDateValidators:
    def setup_method(self):
        from app.validators.amounts import validate_invoice_date, validate_expiry_date
        self.validate_invoice_date = validate_invoice_date
        self.validate_expiry_date = validate_expiry_date

    def test_past_date_passes(self):
        chk = self.validate_invoice_date(date(2024, 3, 15))
        assert chk.status == "pass"

    def test_future_invoice_date_fails(self):
        chk = self.validate_invoice_date(date(2030, 1, 1))
        assert chk.status == "fail"

    def test_none_invoice_date_skipped(self):
        chk = self.validate_invoice_date(None)
        assert chk.status == "skip"

    def test_valid_expiry_after_invoice_passes(self):
        chk = self.validate_expiry_date(date(2024, 4, 30), date(2024, 3, 15))
        assert chk.status == "pass"

    def test_expiry_before_invoice_fails(self):
        chk = self.validate_expiry_date(date(2024, 1, 1), date(2024, 3, 15))
        assert chk.status == "fail"

    def test_none_expiry_skipped(self):
        chk = self.validate_expiry_date(None, date(2024, 3, 15))
        assert chk.status == "skip"


# ---------------------------------------------------------------------------
# INSEE adapter — mocked
# ---------------------------------------------------------------------------

class TestInseeAdapter:
    @pytest.mark.asyncio
    async def test_returns_none_without_credentials(self, monkeypatch):
        """Without INSEE credentials configured, lookup should return None gracefully."""
        from app.adapters import insee as insee_mod

        # Ensure no credentials
        monkeypatch.setattr(insee_mod.settings, "insee_client_id", "")
        monkeypatch.setattr(insee_mod.settings, "insee_client_secret", "")

        result = await insee_mod.lookup_siret("36252187900034")
        assert result is None

    @pytest.mark.asyncio
    async def test_siret_insee_check_skips_on_bad_format(self):
        from app.validators.siret import validate_siret_insee

        check, company = await validate_siret_insee("BAD_SIRET")
        assert check.status in ("skip", "fail")
        assert company is None
