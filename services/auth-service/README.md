# auth-service

Spring Boot service wrapping Keycloak Admin Client.

## Responsibilities

- Create users in the `docflow` realm
- Assign realm roles (`ROLE_OPERATOR`, `ROLE_VALIDATOR`, `ROLE_ADMIN`)
- Expose a simple REST API consumed by api-gateway

## Default users (imported via `docflow-realm.json`)

| Email | Password | Role |
|-------|----------|------|
| operator@docflow.io | operator123 | ROLE_OPERATOR |
| validator@docflow.io | validator123 | ROLE_VALIDATOR |
| admin@docflow.io | admin123 | ROLE_ADMIN |

## Endpoints

`POST /users` · `GET /users/:id` · `POST /users/:id/roles` · `GET /health`
