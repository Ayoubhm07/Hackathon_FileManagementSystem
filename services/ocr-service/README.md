# ocr-service

Python FastAPI service — Tesseract OCR with OpenCV preprocessing.

## Pipeline

`MinIO raw/` → grayscale → deskew → denoise → CLAHE → Tesseract `fra+eng` → `MinIO clean/`

## Endpoints

`POST /ocr` · `GET /health`

## POST /ocr

```json
{
  "document_id": "uuid",
  "storage_path": "uuid/original.pdf",
  "mime_type": "application/pdf",
  "correlation_id": "optional"
}
```
