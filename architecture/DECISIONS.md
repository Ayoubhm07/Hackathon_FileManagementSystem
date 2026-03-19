# DocFlow — Architecture Decision Records

---

## ADR-001: Keycloak over custom JWT

**Status**: Accepted
**Date**: 2024-01-01

### Context
The platform needs authentication and SSO for two separate React frontends (CRM and Compliance), with role-based access control (ROLE_OPERATOR, ROLE_VALIDATOR, ROLE_ADMIN).

### Decision
Use Keycloak as the Identity Provider with OAuth2 Authorization Code Flow + PKCE for frontends. The API Gateway validates JWTs locally via the Keycloak JWKS endpoint (no per-request Keycloak call). A Spring Boot `auth-service` wraps the Keycloak Admin REST API for user/role management.

### Rationale
- SSO between both frontends out of the box (same Keycloak session)
- Standard OAuth2/OIDC — no custom token format to maintain
- Realm export (`docflow-realm.json`) makes environment reproducible
- JWKS-based local validation means zero Keycloak latency on API calls after initial key cache
- Proven security: battle-tested, CVEs patched regularly

### Consequences
- JVM startup time for Keycloak (~30-60s in dev-mode)
- Must version-control realm JSON for reproducibility
- Frontends need keycloak-js adapter

---

## ADR-002: MinIO over cloud storage

**Status**: Accepted
**Date**: 2024-01-01

### Context
Documents are French administrative records (invoices, KBIS, URSSAF) — sensitive data. The hackathon requires offline capability. Production deployment may be on-premises.

### Decision
Use MinIO self-hosted S3-compatible object storage with three zones: `raw/` (original upload), `clean/` (OCR-preprocessed), `curated/` (extracted entities JSON).

### Rationale
- Data sovereignty: documents never leave the platform
- S3-compatible API: can swap to AWS S3 or OVH Object Storage with zero code change
- No egress costs during development and hackathon demo
- Three-zone data lake (bronze/silver/gold) preserves all pipeline states for reprocessing
- Transitions are copies, not moves — raw files are never deleted (audit trail)

### Consequences
- Must provision and maintain MinIO container
- File transitions (raw→clean→curated) are copies; storage doubles per document
- No CDN; presigned URLs expire after configurable TTL

---

## ADR-003: MongoDB over PostgreSQL

**Status**: Accepted
**Date**: 2024-01-01

### Context
Each document type (FACTURE, KBIS, URSSAF, RIB) has a different set of extracted entities. A FACTURE has SIRET + TVA + amounts + dates; a RIB has IBAN + BIC. The schema varies per document type.

### Decision
Use MongoDB with an embedded document model. All pipeline state lives in the `documents` collection as subdocuments.

### Rationale
- Document model maps 1:1 to business concept: one MongoDB document = one administrative document
- No joins needed: single read returns the full document state (OCR result, entities, validation)
- Flexible schema accommodates variable entity sets per document type
- `statusHistory` array enables audit trail without a separate table
- Upsert semantics simplify idempotency: each pipeline step overwrites its subdocument

### Consequences
- No multi-collection ACID transactions (mitigated by upsert + retry)
- `extractedText` can be large (10k+ chars) — acceptable at hackathon scale
- Must define indexes: `documents.status`, `documents.documentType`, `documents.uploadedAt`

---

## ADR-004: REST synchronous communication via Airflow orchestration

**Status**: Accepted
**Date**: 2024-01-01

### Context
The pipeline is strictly sequential: OCR → classify → extract → validate. No parallelism or fan-out is needed.

### Decision
Each Airflow task calls the next service via HTTP POST. Upload-service triggers Airflow via `POST /api/v1/dags/docflow_pipeline/dagRuns` after storing the file. Results are passed between tasks via XCom (document_id, extracted_text, document_type).

### Rationale
- Simple and debuggable: every call is a visible HTTP request
- Airflow handles retries, timeouts, and failure callbacks
- No message broker infrastructure needed (saves 2 containers)
- XCom size is acceptable (extracted text ~10KB, entities ~2KB)

### Consequences
- ~15s minimum latency from upload to first OCR task (Airflow scheduler polling interval)
- Synchronous HTTP means a slow OCR service blocks the Airflow worker slot
- No real-time frontend updates — frontend polls `GET /documents/:id`

### Production alternative
Replace with RabbitMQ/Redis Streams for event-driven processing and WebSocket push to frontends.

---

## ADR-005: Apache Airflow for orchestration

**Status**: Accepted
**Date**: 2024-01-01

### Context
The pipeline needs retry logic, task dependency management, timeout handling, and failure callbacks.

### Decision
Use Apache Airflow 2.7 with LocalExecutor. The DAG `docflow_pipeline` has 5 tasks with `retries=3`, `retry_delay=30s`, `execution_timeout=10min`, and `on_failure_callback` that sets `Document.status = FAILED`.

### Rationale
- DAG visualization is a powerful demo tool (Airflow UI at port 8888)
- Built-in retry with exponential backoff
- `max_active_runs=20` allows parallel document processing
- Team familiarity with Airflow from data engineering context

### Consequences
- Heavy infrastructure: Airflow needs PostgreSQL metadata DB + webserver + scheduler (3 containers)
- 15-30s scheduler polling latency
- `SequentialExecutor` → `LocalExecutor` required for parallel DAG runs

### Production alternative
Temporal.io for durable workflow execution, or Celery chains for lightweight Python-native orchestration.

---

## ADR-006: Docker Compose DNS for service discovery (Eureka removed)

**Status**: Accepted
**Date**: 2024-01-01

### Context
Initial design included Eureka service discovery. Eureka is a Java/Spring Cloud ecosystem tool. The Node.js and Python Eureka clients are poorly maintained.

### Decision
Use Docker Compose service names as DNS hostnames. Services discover each other by container name (e.g., `http://ocr-service:8001`). Service URLs are injected via environment variables.

### Rationale
- Docker's built-in DNS is zero-configuration and always available
- No extra container for Eureka registry
- Service names are static — no dynamic registration needed in a containerized environment
- Fully compatible with Kubernetes (replace with K8s Service DNS)

### Consequences
- Service URLs must be updated if container names change
- No dynamic health-based routing (mitigated by Docker healthchecks + Airflow retries)

---

## Data Flow Diagram

```
                     ┌─────────────────────────────────────────────────────┐
                     │                   DOCFLOW PLATFORM                   │
                     └─────────────────────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────┐                    ┌─────────────────┐
  │ frontend-crm │    │  frontend-   │                    │    Keycloak     │
  │  React+Vite  │    │  compliance  │◄──────────────────►│  (OAuth2/OIDC)  │
  │   :5173      │    │   :5174      │   OAuth2 PKCE SSO  │   :8080         │
  └──────┬───────┘    └──────┬───────┘                    └────────┬────────┘
         │                   │                                     │
         └─────────┬─────────┘                              JWKS endpoint
                   │ HTTP + Bearer JWT                             │
                   ▼                                               │
          ┌─────────────────┐  validates JWT locally   ┌──────────┴────────┐
          │   api-gateway   │◄────────────────────────►│  auth-service     │
          │  NestJS :3000   │  X-User-Id / X-User-Role │  Spring Boot:8081 │
          │  rate-limit     │  injected downstream     │  Keycloak Admin   │
          └────────┬────────┘                          └───────────────────┘
                   │
          ┌────────┴──────────────────┐
          │                           │
          ▼                           ▼
  ┌───────────────┐          ┌──────────────────┐
  │ upload-svc    │          │ validation-svc   │
  │ NestJS :3001  │          │ NestJS :3002      │
  │ POST /upload  │          │ POST /validate   │
  └───────┬───────┘          └────────┬─────────┘
          │                           │ reads MongoDB
          │ 1. Store in MinIO raw/    │ extracted_entities
          │ 2. Create Document        ▼
          │    (status=UPLOADED)  ┌──────────┐
          │ 3. Trigger Airflow    │ MongoDB  │
          │    REST API           │ :27017   │
          ▼                       └──────────┘
  ┌────────────────┐
  │    Airflow     │◄── DAG triggered by upload-service
  │  :8888         │
  │  docflow_      │
  │  pipeline DAG  │
  └───────┬────────┘
          │
          │ Sequential task chain
          │
    ┌─────▼──────┐
    │  ocr_task  │──► POST http://ocr-service:8001/ocr
    └─────┬──────┘    { document_id, storage_path }
          │           → downloads MinIO raw/
          │           → OpenCV preprocess
          │           → Tesseract fra+eng
          │           → saves MinIO clean/
          │           → saves MongoDB ocr_results
          │           XCom: { extracted_text, confidence }
          │
    ┌─────▼──────────────┐
    │ classification_task │──► POST http://classification-service:8002/classify
    └─────┬──────────────┘    { document_id, text }
          │                   → TF-IDF + LogReg (or keyword fallback)
          │                   → returns document_type + confidence
          │                   XCom: { document_type }
          │
    ┌─────▼────────────┐
    │ extraction_task   │──► POST http://extraction-service:8003/extract
    └─────┬────────────┘    { document_id, text, document_type }
          │                 → spaCy NER (fr_core_news_sm)
          │                 → regex: SIRET, TVA, amounts, dates, IBAN
          │                 → saves MongoDB extracted_entities
          │                 → saves MinIO curated/{id}/entities.json
          │
    ┌─────▼────────────┐
    │ validation_task   │──► POST http://validation-service:3002/validate
    └─────┬────────────┘    { documentId }
          │                 → Luhn check (SIRET/SIREN)
          │                 → TVA format (FR + 11 chars)
          │                 → Amount consistency (HT * 1.20 ≈ TTC)
          │                 → URSSAF expiration check
          │                 → Mandatory fields per document type
          │                 → saves MongoDB validation_results
          │
    ┌─────▼────────────┐
    │   notify_task    │──► PATCH http://upload-service:3001/documents/:id/status
    └──────────────────┘    { status: "PROCESSED", documentType: "FACTURE" }
                            → Frontend polls and shows extracted data
                            → Auto-fill form pre-populated

┌─────────────────────────────────────────────────────────────────────┐
│                         MinIO Data Lake                              │
│  raw/{id}/original.pdf  →  clean/{id}/processed.png  →             │
│                              curated/{id}/entities.json             │
│  (copies, never deleted — full audit trail)                         │
└─────────────────────────────────────────────────────────────────────┘
```
