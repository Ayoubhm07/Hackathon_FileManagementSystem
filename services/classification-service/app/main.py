import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request

from app.config import settings
from app.logger import configure_logging, logger
from app.models import ClassifyRequest, ClassifyResponse
from app.ml_classifier import classify_ml, load_model
from app.keyword_classifier import classify_by_keywords
from app import minio_client

# Confidence threshold below which ML result is overridden by keyword fallback
ML_CONFIDENCE_THRESHOLD = 0.6


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.log_level)
    load_model()  # warm up model at startup
    logger.info("classification_service_starting", port=settings.port)
    yield
    logger.info("classification_service_stopping")


app = FastAPI(title="classification-service", version="1.0.0", lifespan=lifespan)


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
    return {"status": "ok", "service": "classification-service"}


@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest) -> ClassifyResponse:
    log = logger.bind(document_id=req.document_id, correlation_id=req.correlation_id)
    log.info("classify_request", clean_text_path=req.clean_text_path)

    # Fetch extracted text from MinIO clean/
    try:
        text = minio_client.download_text(settings.minio_bucket_clean, req.clean_text_path)
        log.info("text_downloaded", text_length=len(text))
    except Exception as exc:
        log.error("minio_download_failed", error=str(exc))
        raise HTTPException(status_code=502, detail=f"Failed to fetch text: {exc}") from exc

    # Try ML classifier first
    document_type, confidence, method = "UNKNOWN", 0.0, "keyword"
    try:
        document_type, confidence = classify_ml(text)
        method = "ml"
        log.info("ml_classification", document_type=document_type, confidence=confidence)
    except RuntimeError:
        log.info("ml_model_unavailable_using_keyword_fallback")

    # Fall back to keyword classifier if ML is unavailable or confidence too low
    if method == "keyword" or confidence < ML_CONFIDENCE_THRESHOLD:
        kw_type, kw_confidence = classify_by_keywords(text)
        if method == "ml" and kw_confidence > confidence:
            log.info(
                "keyword_override",
                ml_type=document_type,
                ml_confidence=confidence,
                kw_type=kw_type,
                kw_confidence=kw_confidence,
            )
            document_type, confidence, method = kw_type, kw_confidence, "keyword"
        elif method == "keyword":
            document_type, confidence = kw_type, kw_confidence

    log.info("classification_result", document_type=document_type, confidence=confidence, method=method)
    return ClassifyResponse(
        document_id=req.document_id,
        document_type=document_type,
        confidence=confidence,
        method=method,
    )
