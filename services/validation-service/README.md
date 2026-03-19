# validation-service

NestJS rule engine for French administrative document validation.

## Rules implemented

| Code | Type | Description |
|------|------|-------------|
| `MISSING_MANDATORY_FIELD` | ERROR | Required field absent for document type |
| `INVALID_SIRET_FORMAT` | ERROR | SIRET not 14 digits |
| `INVALID_SIRET_LUHN` | ERROR | SIRET fails Luhn checksum |
| `INVALID_TVA_FORMAT` | ERROR | TVA not matching `FRxx000000000` |
| `TVA_AMOUNT_INCONSISTENCY` | ERROR | HT × 1.20 ≠ TTC (±2 cents) |
| `URSSAF_EXPIRED` | WARNING | Attestation expiration date in the past |
| `INVALID_IBAN_FORMAT` | ERROR | IBAN not matching French format (FR + 25 chars) |
| `INVALID_IBAN_CHECKSUM` | ERROR | IBAN fails mod-97 check |

## Endpoints

`POST /validate` · `POST /validate/batch` · `GET /validate/:documentId` · `GET /health`
