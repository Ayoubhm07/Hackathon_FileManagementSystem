# classification-service

Python FastAPI service — TF-IDF + Logistic Regression with keyword fallback.

## Strategy

1. Load `models/classifier.joblib` (TF-IDF pipeline) at startup
2. If model confidence ≥ 0.60 → use ML result
3. Otherwise → keyword scoring across 6 document types
4. Always logs method used: `"ml"` or `"keyword"`

## Document types

`FACTURE` · `DEVIS` · `KBIS` · `URSSAF` · `RIB` · `SIRET_ATTESTATION` · `UNKNOWN`

## Endpoints

`POST /classify` · `GET /health`
