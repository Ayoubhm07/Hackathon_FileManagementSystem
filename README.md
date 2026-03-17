# DocFlow

Automated processing platform for French administrative documents (invoices, KBIS, URSSAF, RIB, SIRET attestations).

## Quickstart

```bash
cp .env.example .env
docker compose up -d
open http://localhost:5173
```

## Prerequisites

- Docker 24+ and Docker Compose v2
- 8 GB RAM minimum (Airflow + Keycloak + MongoDB)

## Service URLs

| Service | URL | Credentials |
|---|---|---|
| Frontend CRM | http://localhost:5173 | Keycloak login |
| Frontend Compliance | http://localhost:5174 | Keycloak login |
| API Gateway | http://localhost:3000 | JWT bearer token |
| Keycloak Admin | http://localhost:8080/admin | admin / see .env |
| Airflow UI | http://localhost:8888 | admin / see .env |
| MinIO Console | http://localhost:9001 | see .env |

## Default Users

| Username | Password | Role |
|---|---|---|
| operator1 | operator123 | ROLE_OPERATOR |
| validator1 | validator123 | ROLE_VALIDATOR |
| admin1 | admin123 | ROLE_ADMIN |

## Architecture

10-service microservices platform.
Pipeline: `Upload → OCR → Classify → Extract → Validate`
See [architecture/DECISIONS.md](architecture/DECISIONS.md) for ADRs.

## Development

```bash
# Hot reload all services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Logs for a specific service
make logs SERVICE=ocr-service

# Run tests
make test

# Generate training dataset
cd services/dataset && bash generate_dataset.sh
```
