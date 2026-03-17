"""
Extraction Service — FastAPI entry point.

POST /extract     → ExtractionResult
GET  /health      → {"status": "ok"}
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

# make shared/ importable when running inside the container
sys.path.insert(0, "/app")

from shared.schemas import ExtractionRequest, ExtractionResult
from .config import settings
from .extractor import DocumentExtractor
from .yolo_detector import YOLODocumentDetector

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

_extractor: DocumentExtractor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _extractor
    detector = YOLODocumentDetector(
        model_path=settings.yolo_model_path or None,
        conf_threshold=settings.confidence_threshold,
    )
    _extractor = DocumentExtractor(detector=detector, spacy_model=settings.spacy_model)
    logger.info("DocumentExtractor ready (YOLO=%s)", detector.enabled)
    yield
    _extractor = None


app = FastAPI(
    title="Extraction Service",
    description="Extracts structured entities from OCR text using YOLOv8 + regex + spaCy",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "yolo_enabled": _extractor.detector.enabled if _extractor else False}


@app.post("/extract", response_model=ExtractionResult)
async def extract(request: ExtractionRequest) -> ExtractionResult:
    if _extractor is None:
        raise HTTPException(status_code=503, detail="Extractor not initialised")
    try:
        return _extractor.extract(
            document_id=request.document_id,
            document_type=request.document_type,
            ocr_text=request.ocr_text,
            image_path=request.image_path,
        )
    except Exception as exc:
        logger.exception("Extraction failed for document %s", request.document_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
