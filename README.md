# Hackathon Dataset Toolkit

Toolkit Python pour constituer le dataset du hackathon:

- normalisation d'un export SIRENE en `company_pool.csv`
- generation de cas `train/validation/test`
- rendu de documents `invoice`, `quote`, `attestation`, `rib`
- export `raw / clean / curated`
- scenarios coherents, falsifies et OCR-degrades
- variations de styles visuels, palettes et decorations documentaires
- import optionnel de "vraies" factures d'exemple via un manifest

## Structure

```text
configs/
examples/
scripts/
src/hackathon_dataset/
tests/
```

## Prerequis

```powershell
py -3.14 -m pip install -r requirements.txt
```

## 1. Preparer un pool d'entreprises depuis SIRENE

Telecharge un CSV depuis la base SIRENE, puis:

```powershell
py -3.14 scripts\dataset_cli.py prepare-companies `
  --input path\to\sirene.csv `
  --output inputs\company_pool.csv `
  --limit 500
```

Le script filtre les etablissements actifs, reconstruit un nom exploitable, calcule un numero de TVA FR a partir du SIREN, puis ecrit un CSV leger pour le generateur.

Pour un test rapide sans SIRENE, tu peux partir de `examples/company_pool.sample.csv`.

## Pourquoi `company_pool.csv` existe

Ce fichier n'est pas le dataset final. C'est le referentiel d'entreprises utilise pour rendre le dataset credible.

Le generateur s'en sert pour:

- choisir un fournisseur et un client realistes
- injecter de vrais formats de `SIRET`, `TVA`, adresses, villes
- construire des cas coherents ou incoherents entre documents
- eviter d'inventer des entreprises completement fictives a chaque execution

En pratique:

- tu telecharges ou exportes SIRENE
- tu l'alleges avec `prepare-companies`
- tu obtiens `company_pool.csv`
- `build-dataset` lit ce fichier pour fabriquer les documents

Si tu ne fais rien, le projet utilise simplement l'echantillon `examples/company_pool.sample.csv`.

## 2. Ajouter des factures "reelles" d'exemple

Depose tes PDF/images/XML officiels dans un dossier local, puis complete un manifest sur la base de `examples/real_examples/manifest.sample.csv`.

Colonnes minimales:

- `file_path`
- `doc_type`
- `supplier_name`
- `supplier_siret`
- `invoice_number`
- `issue_date`
- `amount_ttc`

Colonnes utiles:

- `supplier_vat`
- `amount_ht`
- `amount_tva`
- `source_url`
- `ocr_text_path`
- `style_id`
- `notes`

Le generateur copie ces fichiers dans `raw/`, fabrique l'annotation `curated/` et ecrit un texte de reference dans `clean/`.

## 3. Generer le dataset

```powershell
py -3.14 scripts\dataset_cli.py build-dataset `
  --config configs\dataset_config.yaml `
  --output generated\dataset
```

Sortie:

```text
generated/dataset/
  raw/
    train|validation|test/
  clean/
    train|validation|test/
  curated/
    documents.jsonl
    cases.jsonl
    documents.csv
    cases.csv
    build_summary.json
```

## Scenarios implementes

- `legitimate_pdf`
- `legitimate_scan`
- `legitimate_smartphone`
- `forged_amount_pdf`
- `forged_identifier_scan`
- `invoice_quote_mismatch`
- `expired_attestation`
- `attestation_siret_mismatch`
- `rib_mismatch`
- `missing_field_scan`

Chaque scenario produit un `case_id`, un ou plusieurs documents et un verdict attendu (`coherent`, `amount_mismatch`, `siret_mismatch`, `expired_attestation`, etc.).

## Format des annotations

`documents.jsonl` contient un objet par document:

- identifiants: `doc_id`, `case_id`, `split`
- type/source: `doc_type`, `source_type`, `file_format`
- labels metier: `supplier_*`, `customer_*`, `invoice_number`, `issue_date`, `due_date`, montants
- flags: `is_forged`, `is_expired`, `has_cross_doc_inconsistency`
- qualite: `quality_profile`
- provenance: `source_url`, `notes`

`cases.jsonl` contient un objet par cas:

- `case_id`
- `scenario_id`
- `split`
- `document_ids`
- `expected_consistency_status`
- `expected_issues`

## Conseils d'usage pour le groupe

- Utiliser `train` surtout en synthetique.
- Garder des exemples "reels" dans `validation` et surtout `test`.
- Ne pas melanger des factures privees non autorisees avec les exemples publics/officiels.
- Versionner `configs/` et les manifests, pas le dataset genere si le volume devient important.
