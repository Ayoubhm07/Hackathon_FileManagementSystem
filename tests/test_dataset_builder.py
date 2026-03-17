from __future__ import annotations

import json
import shutil
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from hackathon_dataset.builder import build_dataset
from hackathon_dataset.companies import compute_french_vat_from_siren, normalize_sirene_csv
from hackathon_dataset.config import load_config


TEST_TMP = ROOT / ".test_artifacts"


class CompanyPreparationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_dir = TEST_TMP / self._testMethodName
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)
        self.test_dir.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)

    def test_compute_french_vat_from_siren(self) -> None:
        self.assertEqual(compute_french_vat_from_siren("732829320"), "FR44732829320")

    def test_normalize_sirene_csv(self) -> None:
        input_path = self.test_dir / "sirene.csv"
        output_path = self.test_dir / "company_pool.csv"
        input_path.write_text(
            "\n".join(
                [
                    "siret,denominationUniteLegale,etatAdministratifEtablissement,numeroVoieEtablissement,typeVoieEtablissement,libelleVoieEtablissement,codePostalEtablissement,libelleCommuneEtablissement,activitePrincipaleEtablissement",
                    "73282932000074,Atelier Meridien Conseil,A,18,Rue,des Lavandieres,31000,Toulouse,7022Z",
                    "00557250800025,[ND],A,[ND],[ND],[ND],[ND],LE POULIGUEN,6820A",
                    "00000000000000,Ignoree,F,1,Rue,Fausse,75001,Paris,0000Z",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

        written = normalize_sirene_csv(input_path, output_path, limit=10)
        self.assertEqual(written, 1)
        content = output_path.read_text(encoding="utf-8")
        self.assertIn("Atelier Meridien Conseil", content)
        self.assertIn("FR44732829320", content)
        self.assertNotIn("[ND]", content)


class DatasetBuildTests(unittest.TestCase):
    def setUp(self) -> None:
        self.test_dir = TEST_TMP / self._testMethodName
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)
        self.test_dir.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)

    def test_build_dataset_smoke(self) -> None:
        config = load_config(ROOT / "configs" / "dataset_config.yaml")
        summary = build_dataset(config, self.test_dir / "dataset")

        self.assertGreater(summary["documents"], 0)
        self.assertGreater(summary["cases"], 0)

        summary_path = self.test_dir / "dataset" / "curated" / "build_summary.json"
        self.assertTrue(summary_path.exists())
        payload = json.loads(summary_path.read_text(encoding="utf-8"))
        self.assertEqual(payload["cases"], summary["cases"])


if __name__ == "__main__":
    unittest.main()
