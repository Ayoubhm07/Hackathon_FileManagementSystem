import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.logger import configure_logging, logger
from app.models import OcrRequest, OcrResponse
from app.preprocessor import preprocess
from app.ocr_engine import run_ocr
from app import minio_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.log_level)
    logger.info("ocr_service_starting", port=settings.port)
    yield
    logger.info("ocr_service_stopping")


app = FastAPI(title="ocr-service", version="1.0.0", lifespan=lifespan)


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
    return {"status": "ok", "service": "ocr-service"}


@app.post("/ocr", response_model=OcrResponse)
def run_ocr_endpoint(req: OcrRequest) -> OcrResponse:
    log = logger.bind(document_id=req.document_id, correlation_id=req.correlation_id)
    log.info("ocr_request_received", storage_path=req.storage_path)

    try:
        raw_bytes = minio_client.download_object(settings.minio_bucket_raw, req.storage_path)
    except Exception as exc:
        log.error("minio_download_failed", error=str(exc))
        raise HTTPException(status_code=502, detail=f"Failed to download from MinIO: {exc}") from exc

    # Preprocess only images (not PDFs)
    if req.mime_type.startswith("image/"):
        try:
            processed_bytes = preprocess(raw_bytes)
            log.info("preprocessing_done", original_size=len(raw_bytes), processed_size=len(processed_bytes))
        except Exception as exc:
            log.warning("preprocessing_failed_using_raw", error=str(exc))
            processed_bytes = raw_bytes
    else:
        processed_bytes = raw_bytes

    # Run OCR
    try:
        text = run_ocr(processed_bytes, req.mime_type, req.correlation_id)
        log.info("ocr_done", text_length=len(text))
    except Exception as exc:
        log.error("ocr_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}") from exc

    # Store preprocessed image + extracted text in clean/
    clean_image_path = req.storage_path.replace("original.", "clean.")
    clean_text_path = req.storage_path.rsplit(".", 1)[0] + ".txt"

    try:
        minio_client.upload_object(settings.minio_bucket_clean, clean_image_path, processed_bytes, req.mime_type)
        minio_client.upload_object(settings.minio_bucket_clean, clean_text_path, text.encode("utf-8"), "text/plain")
    except Exception as exc:
        log.error("minio_upload_failed", error=str(exc))
        raise HTTPException(status_code=502, detail=f"Failed to upload to MinIO clean: {exc}") from exc

    log.info("ocr_pipeline_complete", clean_path=clean_text_path)
    return OcrResponse(
        document_id=req.document_id,
        storage_path=req.storage_path,
        clean_path=clean_text_path,
        text_length=len(text),
    )
