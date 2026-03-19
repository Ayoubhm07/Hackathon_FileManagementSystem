# DocFlow — Project Plan & Status

> Last updated: 2026-03-18
> Pipeline execution confirmed working end-to-end.

---

## Current Status Overview

| Layer | Component | Status |
|---|---|---|
| Infrastructure | Docker Compose + networking | ✅ Complete |
| Infrastructure | MongoDB | ✅ Running |
| Infrastructure | MinIO (3-zone data lake) | ✅ Running |
| Infrastructure | Keycloak + PostgreSQL (persistent) | ✅ Running |
| Infrastructure | Airflow (webserver + scheduler + init) | ✅ Running |
| Backend | api-gateway (NestJS) | ✅ Complete |
| Backend | auth-service (Spring Boot) | ✅ Complete |
| Backend | upload-service (NestJS) | ✅ Complete |
| Backend | ocr-service (Python) | ✅ Complete |
| Backend | classification-service (Python) | ✅ Complete |
| Backend | extraction-service (Python) | ✅ Complete |
| Backend | validation-service (NestJS) | ✅ Complete |
| Pipeline | Airflow DAG (5 tasks) | ✅ Complete |
| Frontend | frontend-crm — upload + document list | ✅ Working |
| Frontend | frontend-compliance — dashboard charts | ✅ Working |
| Frontend | Role-based routing post-login | ❌ Missing |
| Frontend | Validation result panel (per document) | 🔄 Scaffold only |
| Frontend | Extracted entities display | ❌ Missing |
| Frontend | PDF export (compliance report) | ❌ Missing |
| Quality | Tests — all services | ❌ Missing |
| Quality | API documentation (Swagger) | ❌ Missing |
| ML | Classification model training pipeline | ❌ Missing |

---

## What Works End-to-End ✅

1. User authenticates via Keycloak (PKCE flow)
2. User uploads PDF/image via CRM frontend
3. API Gateway validates JWT and proxies to upload-service
4. upload-service stores file in MinIO `raw/` bucket and creates MongoDB document
5. Airflow DAG is triggered with document_id
6. **OCR task**: Tesseract extracts text → stored in MinIO `clean/`
7. **Classification task**: TF-IDF + keyword classifier identifies document type
8. **Extraction task**: spaCy NER + regex extracts entities → MongoDB + MinIO `curated/`
9. **Validation task**: Business rules checked (SIRET Luhn, TVA format, IBAN modulo-97)
10. **Notify task**: Document status set to PROCESSED
11. CRM frontend polls and displays updated document list with status badge

---

## Missing Steps — Ordered by Priority

### PRIORITY 1 — Required for Demo

#### 1.1 Role-based routing after login
- **Service**: `frontend-crm` + `frontend-compliance`
- **What**: After Keycloak auth, redirect `ROLE_OPERATOR` → CRM (`:5173`), `ROLE_VALIDATOR/ADMIN` → Compliance (`:5174`). Currently all users land on CRM.
- **Files**: `src/main.tsx` or `src/App.tsx` in both frontends — read Keycloak token roles and route accordingly.

#### 1.2 Display validation results per document
- **Service**: `frontend-compliance`
- **What**: `ValidationResultPanel.tsx` exists as a scaffold. Connect it to `GET /results/:id` via API Gateway. Display: isValid badge, errors[], warnings[] with codes and messages.
- **Files**: `src/components/ValidationResultPanel.tsx`, `src/components/ValidationDashboard.tsx`

#### 1.3 Display extracted entities per document
- **Service**: `frontend-crm` + `frontend-compliance`
- **What**: After clicking a document, show extracted fields (SIRET, TVA, IBAN, amounts, dates). Requires new API endpoint in api-gateway proxying to extraction-service.
- **Files**: `gateway.controller.ts` (new route), new frontend component

#### 1.4 Expose extracted entities via API Gateway
- **Service**: `api-gateway`
- **What**: Add `GET /entities/:documentId` route proxying to `http://extraction-service:8003/entities/:documentId`.
- **Files**: `services/api-gateway/src/gateway/gateway.controller.ts`, `gateway.service.ts`
- **Note**: extraction-service must expose a GET endpoint for this.

---

### PRIORITY 2 — Demo Polish

#### 2.1 Add GET /entities/:documentId to extraction-service
- **Service**: `extraction-service`
- **What**: New endpoint to fetch stored extracted entities from MongoDB by documentId.
- **Files**: `services/extraction-service/app/main.py`, `app/mongo_client.py`

#### 2.2 PDF compliance report export
- **Service**: `frontend-compliance`
- **What**: `jsPDF` + `jsPDF-autotable` already in package.json. Add "Export PDF" button in ValidationResultPanel that generates a formatted compliance report.
- **Files**: `src/components/ValidationResultPanel.tsx`

#### 2.3 Document status auto-refresh in CRM
- **Service**: `frontend-crm`
- **What**: Currently polls every 5s. Add visual indicator (spinner) when status is PROCESSING so user knows pipeline is running.
- **Files**: `src/components/DocumentList.tsx`, `src/components/StatusBadge.tsx`

#### 2.4 Error state handling in frontends
- **Service**: `frontend-crm` + `frontend-compliance`
- **What**: Show proper error messages when API calls fail (network error, 401, 500). Currently some silent failures.
- **Files**: Both `App.tsx` files, API interceptors in `api.ts`

---

### PRIORITY 3 — Quality & Robustness

#### 3.1 Unit tests — NestJS services
- **Services**: `api-gateway`, `upload-service`, `validation-service`
- **What**: Jest test suites. Minimum: controller unit tests with mocked services, service unit tests with mocked repositories.
- **Files**: `*.spec.ts` files in each service's `src/` folder

#### 3.2 Unit tests — Python services
- **Services**: `ocr-service`, `classification-service`, `extraction-service`
- **What**: pytest test suites. Test OCR engine, regex patterns, classification logic, extraction per document type.
- **Files**: `tests/` folder in each service

#### 3.3 Swagger/OpenAPI documentation
- **Services**: `api-gateway`, `validation-service`, `upload-service`
- **What**: Add `@nestjs/swagger` decorators to controllers and DTOs. Auto-generate at `/api/docs`.
- **Files**: `main.ts` (SwaggerModule setup), controller decorators

#### 3.4 Classification ML model training
- **Service**: `classification-service`, `dataset/`
- **What**: Run `services/dataset/generate_invoices.py` to create training data, then train and serialize the TF-IDF + LogisticRegression model to `models/classifier.joblib`.
- **Note**: Currently the service falls back to keyword classifier if model file is missing. Training the model improves classification accuracy.

#### 3.5 MinIO bucket policy (read-only for clean/curated)
- **Service**: `upload-service` (MinioService.onModuleInit)
- **What**: Set appropriate bucket policies to restrict access. Currently all buckets are created with no explicit policy.
- **Files**: `services/upload-service/src/minio/minio.service.ts`

---

### PRIORITY 4 — Infrastructure Hardening

#### 4.1 Add `MONGODB_URI` alias consistency
- **Services**: `ocr-service`, `classification-service`
- **What**: Verify that all Python services read `MONGO_URI` (not `MONGODB_URI`) from env, matching docker-compose variable name.
- **Files**: `config.py` in each Python service

#### 4.2 Airflow DAG — pass mime_type from upload-service
- **Service**: `upload-service` (AirflowService), `airflow-pipeline`
- **What**: The DAG receives `mime_type` as a param but `airflow.service.ts` doesn't send it. The OCR service defaults to `application/pdf` if missing.
- **Files**: `services/upload-service/src/airflow/airflow.service.ts`

#### 4.3 Upload-service — retry Airflow trigger
- **Service**: `upload-service`
- **What**: Currently Airflow trigger is fire-and-forget. If Airflow is not ready, the document stays PROCESSING forever. Add simple retry with exponential backoff (max 3 attempts).
- **Files**: `services/upload-service/src/airflow/airflow.service.ts`

#### 4.4 Health check for frontend containers
- **Service**: `frontend-crm`, `frontend-compliance`
- **What**: Nginx healthcheck targets port 5173/5174 in Dockerfiles but nginx now listens on 80. Update HEALTHCHECK to use port 80.
- **Files**: `services/frontend-crm/Dockerfile`, `services/frontend-compliance/Dockerfile`

---

## Demo Credentials

| User | Password | Role | Frontend |
|---|---|---|---|
| `operator@docflow.io` | `operator123` | ROLE_OPERATOR | CRM (:5173) |
| `validator@docflow.io` | `validator123` | ROLE_VALIDATOR | Compliance (:5174) |
| `admin@docflow.io` | `admin123` | ROLE_ADMIN + all | Both |

## Service URLs (local)

| Service | URL |
|---|---|
| CRM Frontend | http://localhost:5173 |
| Compliance Frontend | http://localhost:5174 |
| API Gateway | http://localhost:3000 |
| Keycloak Admin | http://localhost:8080/admin |
| Airflow UI | http://localhost:8888 |
| MinIO Console | http://localhost:9001 |

---

## Quick Fix Checklist (before demo)

- [ ] 1.1 Role-based routing
- [ ] 1.2 ValidationResultPanel connected to API
- [ ] 1.3 Extracted entities display
- [ ] 1.4 + 2.1 GET /entities endpoint (gateway + extraction-service)
- [ ] 2.2 PDF export button
- [ ] 4.2 Pass mime_type to Airflow
- [ ] 4.4 Fix healthcheck ports in frontend Dockerfiles
