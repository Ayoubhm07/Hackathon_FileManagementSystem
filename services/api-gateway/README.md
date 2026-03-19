# api-gateway

NestJS API Gateway. Validates JWTs via Keycloak JWKS, injects auth headers, rate limits, proxies to backend services.

## Endpoints

| Method | Path | Auth | Proxies to |
|---|---|---|---|
| POST | /upload | JWT | upload-service |
| GET | /documents | JWT | upload-service |
| GET | /documents/:id | JWT | upload-service |
| GET | /results/:id | JWT | validation-service |
| POST | /auth/users | None | auth-service |
| GET | /health | None | local |

## Environment Variables

`PORT`, `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `UPLOAD_SERVICE_URL`, `VALIDATION_SERVICE_URL`, `AUTH_SERVICE_URL`, `CORS_ORIGIN`, `THROTTLE_TTL`, `THROTTLE_LIMIT`
