# upload-service

NestJS service. Accepts PDF/PNG/JPG/TIFF (max 10MB), stores in MinIO raw/, creates MongoDB Document record, triggers Airflow pipeline.

## Endpoints

`POST /upload` · `GET /documents` · `GET /documents/:id` · `PATCH /documents/:id/status` · `GET /health`
