"""
Airflow DAG — Document Processing Pipeline

Tasks:
  upload          (trigger, external)
  ↓
  ocr             call OCR service      → xcom: ocr_text, image_path
  ↓
  classify        call Classification   → xcom: document_type
  ↓
  extract         POST /extract         → xcom: ExtractionResult (JSON)
  ↓
  validate        POST /validate        → xcom: ValidationResult (JSON)
  ↓
  store           write to MongoDB
  ↓
  notify          HTTP callback to frontend/CRM webhook

Environment variables needed (set in Airflow → Admin → Variables or .env):
  EXTRACTION_SERVICE_URL   http://extraction_service:8001
  VALIDATION_SERVICE_URL   http://validation_service:8002
  OCR_SERVICE_URL          http://ocr_service:8003
  CLASSIFIER_SERVICE_URL   http://classifier_service:8004
  MONGODB_URI              mongodb://mongodb:27017
  MONGODB_DB               docplatform
  FRONTEND_WEBHOOK_URL     http://frontend:3000/api/webhooks/document-processed
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any

import requests
from airflow.decorators import dag, task
from airflow.models import Variable
from airflow.utils.dates import days_ago

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Service URLs — read from Airflow Variables (fallback to env)
# ---------------------------------------------------------------------------

def _url(key: str, default: str) -> str:
    try:
        return Variable.get(key)
    except Exception:
        return os.getenv(key, default)


EXTRACTION_URL = _url("EXTRACTION_SERVICE_URL", "http://extraction_service:8001")
VALIDATION_URL = _url("VALIDATION_SERVICE_URL", "http://validation_service:8002")
OCR_URL = _url("OCR_SERVICE_URL", "http://ocr_service:8003")
CLASSIFIER_URL = _url("CLASSIFIER_SERVICE_URL", "http://classifier_service:8004")
MONGODB_URI = _url("MONGODB_URI", "mongodb://mongodb:27017")
MONGODB_DB = _url("MONGODB_DB", "docplatform")
WEBHOOK_URL = _url("FRONTEND_WEBHOOK_URL", "")

_DEFAULT_ARGS = {
    "owner": "platform",
    "retries": 2,
    "retry_delay": timedelta(seconds=30),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=5),
    "execution_timeout": timedelta(minutes=10),
}


# ---------------------------------------------------------------------------
# DAG
# ---------------------------------------------------------------------------

@dag(
    dag_id="document_processing_pipeline",
    description="Upload → OCR → Classification → Extraction → Validation → Store → Notify",
    schedule=None,                          # triggered by Upload Service via API
    start_date=days_ago(1),
    catchup=False,
    default_args=_DEFAULT_ARGS,
    tags=["documents", "extraction", "validation"],
    params={
        "document_id": "",
        "storage_path": "",                 # MinIO path
        "document_type_hint": "unknown",    # optional hint from Upload Service
    },
)
def document_processing_pipeline():

    # ------------------------------------------------------------------
    @task(task_id="run_ocr")
    def run_ocr(**context) -> dict[str, Any]:
        """Call OCR Service to get extracted text + image path."""
        params = context["params"]
        doc_id = params["document_id"]
        storage_path = params["storage_path"]

        resp = requests.post(
            f"{OCR_URL}/ocr",
            json={"document_id": doc_id, "storage_path": storage_path},
            timeout=120,
        )
        resp.raise_for_status()
        result = resp.json()
        logger.info("OCR done for %s — confidence %.2f", doc_id, result.get("confidence_score", 0))
        return {
            "document_id": doc_id,
            "ocr_text": result["extracted_text"],
            "image_path": result.get("image_path"),
            "confidence_score": result.get("confidence_score"),
        }

    # ------------------------------------------------------------------
    @task(task_id="classify_document")
    def classify_document(ocr_data: dict[str, Any]) -> dict[str, Any]:
        """Call Classification Service to determine document type."""
        resp = requests.post(
            f"{CLASSIFIER_URL}/classify",
            json={"document_id": ocr_data["document_id"], "text": ocr_data["ocr_text"]},
            timeout=30,
        )
        resp.raise_for_status()
        result = resp.json()
        logger.info(
            "Classified %s as %s (score %.2f)",
            ocr_data["document_id"],
            result["document_type"],
            result.get("confidence", 0),
        )
        return {**ocr_data, "document_type": result["document_type"]}

    # ------------------------------------------------------------------
    @task(task_id="extract_entities")
    def extract_entities(classified_data: dict[str, Any]) -> dict[str, Any]:
        """POST to Extraction Service — returns ExtractionResult JSON."""
        payload = {
            "document_id": classified_data["document_id"],
            "document_type": classified_data["document_type"],
            "ocr_text": classified_data["ocr_text"],
            "image_path": classified_data.get("image_path"),
        }
        resp = requests.post(
            f"{EXTRACTION_URL}/extract",
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        extraction_result = resp.json()
        logger.info(
            "Extracted %d entities from document %s",
            len(extraction_result.get("entities", [])),
            classified_data["document_id"],
        )
        return extraction_result

    # ------------------------------------------------------------------
    @task(task_id="validate_entities")
    def validate_entities(extraction_result: dict[str, Any]) -> dict[str, Any]:
        """POST ExtractionResult to Validation Service — returns ValidationResult JSON."""
        resp = requests.post(
            f"{VALIDATION_URL}/validate",
            json=extraction_result,
            timeout=30,
        )
        resp.raise_for_status()
        validation_result = resp.json()
        logger.info(
            "Validated document %s — is_valid=%s score=%.3f errors=%d",
            extraction_result["document_id"],
            validation_result["is_valid"],
            validation_result["overall_score"],
            len(validation_result.get("errors", [])),
        )
        return validation_result

    # ------------------------------------------------------------------
    @task(task_id="store_results")
    def store_results(
        extraction_result: dict[str, Any],
        validation_result: dict[str, Any],
    ) -> str:
        """Persist both results to MongoDB."""
        from pymongo import MongoClient

        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[MONGODB_DB]
        doc_id = extraction_result["document_id"]

        db["extracted_entities"].replace_one(
            {"document_id": doc_id},
            {**extraction_result, "_updated": datetime.utcnow()},
            upsert=True,
        )
        db["validation_results"].replace_one(
            {"document_id": doc_id},
            {**validation_result, "_updated": datetime.utcnow()},
            upsert=True,
        )
        db["documents"].update_one(
            {"id": doc_id},
            {"$set": {
                "status": "validated" if validation_result["is_valid"] else "validation_failed",
                "validation_score": validation_result["overall_score"],
                "processedAt": datetime.utcnow(),
            }},
        )
        client.close()
        logger.info("Stored results for document %s", doc_id)
        return doc_id

    # ------------------------------------------------------------------
    @task(task_id="notify_consumers")
    def notify_consumers(
        document_id: str,
        validation_result: dict[str, Any],
    ):
        """
        Push the ValidationResult to the frontend/CRM webhook.
        Fails silently — a notification error must not roll back the pipeline.
        """
        if not WEBHOOK_URL:
            logger.info("No FRONTEND_WEBHOOK_URL configured — skipping notification")
            return

        payload = {
            "event": "document.processed",
            "document_id": document_id,
            "is_valid": validation_result["is_valid"],
            "overall_score": validation_result["overall_score"],
            "errors": validation_result.get("errors", []),
            "raw_fields": validation_result.get("raw_fields", {}),
            "enriched_company": validation_result.get("enriched_company"),
            "timestamp": datetime.utcnow().isoformat(),
        }
        try:
            resp = requests.post(WEBHOOK_URL, json=payload, timeout=10)
            resp.raise_for_status()
            logger.info("Webhook notified for document %s", document_id)
        except requests.RequestException as exc:
            logger.warning("Webhook notification failed (non-fatal): %s", exc)

    # ------------------------------------------------------------------
    # Wire up the DAG
    # ------------------------------------------------------------------
    ocr_data = run_ocr()
    classified = classify_document(ocr_data)
    extraction = extract_entities(classified)
    validation = validate_entities(extraction)
    stored_id = store_results(extraction, validation)
    notify_consumers(stored_id, validation)


document_processing_pipeline()
