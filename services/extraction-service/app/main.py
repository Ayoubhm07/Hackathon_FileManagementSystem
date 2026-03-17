import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request

from app.config import settings
from app.logger import configure_logging, logger
from app.models import ExtractRequest, ExtractResponse
from app.extractor import extract, load_nlp
from app import minio_client, mongo_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.log_level)
    load_nlp()  # warm up spaCy model
    logger.info("extraction_service_starting", port=settings.port)
    yield
    logger.info("extraction_service_stopping")


app = FastAPI(title="extraction-service", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-correlation-id", "")
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    response = await call_next(request)
    if correlation_id:
        response.headers["x-correlation-id"] = correlation_id
    return response


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "extraction-service"}


@app.post("/extract", response_model=ExtractResponse)
def extract_entities(req: ExtractRequest) -> ExtractResponse:
    log = logger.bind(document_id=req.document_id, correlation_id=req.correlation_id)
    log.info("extract_request", document_type=req.document_type, clean_text_path=req.clean_text_path)

    # Fetch OCR text from MinIO clean/
    try:
        text = minio_client.download_text(settings.minio_bucket_clean, req.clean_text_path)
        log.info("text_downloaded", text_length=len(text))
    except Exception as exc:
        log.error("minio_download_failed", error=str(exc))
        raise HTTPException(status_code=502, detail=f"Failed to fetch text from MinIO: {exc}") from exc

    # Extract entities
    entities = extract(text, req.document_type)
    meaningful_fields = {k: v for k, v in entities.items() if k not in ("documentType", "rawEntities") and v is not None}
    log.info("extraction_done", fields=list(meaningful_fields.keys()))

    # Persist to MongoDB (upsert — idempotent)
    try:
        mongo_client.upsert_entity(req.document_id, entities)
    except Exception as exc:
        log.error("mongo_upsert_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"Failed to persist entities: {exc}") from exc

    # Upload JSON to MinIO curated/
    curated_key = f"{req.document_id}/entities.json"
    try:
        minio_client.upload_json(settings.minio_bucket_curated, curated_key, entities)
    except Exception as exc:
        log.error("minio_curated_upload_failed", error=str(exc))
        raise HTTPException(status_code=502, detail=f"Failed to upload to curated: {exc}") from exc

    log.info("extraction_complete", curated_path=curated_key, fields_extracted=len(meaningful_fields))
    return ExtractResponse(
        document_id=req.document_id,
        document_type=req.document_type,
        curated_path=curated_key,
        fields_extracted=len(meaningful_fields),
    )
