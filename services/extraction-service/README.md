# extraction-service

Python FastAPI service — spaCy NER + regex entity extraction.

## Extracts

| Field | Method | Doc Types |
|-------|--------|-----------|
| SIRET (14 digits, Luhn validated) | regex | All |
| TVA number (`FRxx000000000`) | regex | FACTURE, DEVIS |
| Invoice number | regex | FACTURE, DEVIS |
| Amounts (HT/TVA/TTC) | regex | FACTURE, DEVIS |
| IBAN + BIC | regex | RIB |
| URSSAF expiration date | regex | URSSAF |
| Company name | spaCy NER ORG | All |
| RCS / legal form / capital | regex | KBIS |

## Pipeline

`MinIO clean/.txt` → spaCy NER + regex → MongoDB `extracted_entities` (upsert) → `MinIO curated/entities.json`

## Endpoints

`POST /extract` · `GET /health`
