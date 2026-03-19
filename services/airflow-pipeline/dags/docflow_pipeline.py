"""
DocFlow Airflow DAG — docflow_pipeline

Tasks:
  ocr_task → classification_task → extraction_task → validation_task → notify_task

Retry strategy: retries=3, retry_delay=30s, timeout=10min
On failure: set document status to FAILED in MongoDB via callback
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta

import httpx
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago

from callbacks import on_dag_failure

log = logging.getLogger(__name__)

# ── Service URLs (resolved via Docker DNS) ───────────────────────────────────
OCR_URL = "http://ocr-service:8001/ocr"
CLASSIFY_URL = "http://classification-service:8002/classify"
EXTRACT_URL = "http://extraction-service:8003/extract"
VALIDATE_URL = "http://validation-service:3002/validate"
UPLOAD_URL = "http://upload-service:3001/documents"

_DEFAULT_TIMEOUT = 120  # seconds

# ── DAG definition ────────────────────────────────────────────────────────────
default_args = {
    "owner": "docflow",
    "retries": 3,
    "retry_delay": timedelta(seconds=30),
    "execution_timeout": timedelta(minutes=10),
    "on_failure_callback": on_dag_failure,
}

with DAG(
    dag_id="docflow_pipeline",
    default_args=default_args,
    description="End-to-end document processing: OCR → classify → extract → validate → notify",
    schedule_interval=None,  # triggered via API
    start_date=days_ago(1),
    catchup=False,
    max_active_runs=10,
    tags=["docflow", "pipeline"],
    params={
        "document_id": "",
        "storage_path": "",
        "mime_type": "application/pdf",
        "correlation_id": "",
    },
) as dag:

    def _headers(context: dict) -> dict[str, str]:
        correlation_id = context["params"].get("correlation_id", "")
        return {"X-Correlation-Id": correlation_id, "Content-Type": "application/json"}

    # ── Task 1: OCR ───────────────────────────────────────────────────────────
    def ocr_task_fn(**context):
        params = context["params"]
        doc_id = params["document_id"]
        storage_path = params["storage_path"]
        mime_type = params.get("mime_type", "application/pdf")

        log.info("[%s] Starting OCR for document %s", params.get("correlation_id"), doc_id)

        payload = {
            "document_id": doc_id,
            "storage_path": storage_path,
            "mime_type": mime_type,
            "correlation_id": params.get("correlation_id", ""),
        }

        resp = httpx.post(OCR_URL, json=payload, headers=_headers(context), timeout=_DEFAULT_TIMEOUT)
        resp.raise_for_status()
        result = resp.json()

        log.info("[%s] OCR done: clean_path=%s text_length=%d",
                 params.get("correlation_id"), result.get("clean_path"), result.get("text_length", 0))

        context["task_instance"].xcom_push(key="clean_path", value=result["clean_path"])
        return result

    # ── Task 2: Classification ─────────────────────────────────────────────
    def classification_task_fn(**context):
        params = context["params"]
        doc_id = params["document_id"]
        clean_path = context["task_instance"].xcom_pull(task_ids="ocr_task", key="clean_path")

        log.info("[%s] Classifying document %s", params.get("correlation_id"), doc_id)

        payload = {
            "document_id": doc_id,
            "clean_text_path": clean_path,
            "correlation_id": params.get("correlation_id", ""),
        }

        resp = httpx.post(CLASSIFY_URL, json=payload, headers=_headers(context), timeout=60)
        resp.raise_for_status()
        result = resp.json()

        log.info("[%s] Classification done: type=%s confidence=%.2f method=%s",
                 params.get("correlation_id"), result.get("document_type"),
                 result.get("confidence", 0), result.get("method"))

        context["task_instance"].xcom_push(key="document_type", value=result["document_type"])
        return result

    # ── Task 3: Extraction ─────────────────────────────────────────────────
    def extraction_task_fn(**context):
        params = context["params"]
        doc_id = params["document_id"]
        ti = context["task_instance"]
        clean_path = ti.xcom_pull(task_ids="ocr_task", key="clean_path")
        document_type = ti.xcom_pull(task_ids="classification_task", key="document_type")

        log.info("[%s] Extracting entities from document %s (type=%s)",
                 params.get("correlation_id"), doc_id, document_type)

        payload = {
            "document_id": doc_id,
            "clean_text_path": clean_path,
            "document_type": document_type,
            "correlation_id": params.get("correlation_id", ""),
        }

        resp = httpx.post(EXTRACT_URL, json=payload, headers=_headers(context), timeout=_DEFAULT_TIMEOUT)
        resp.raise_for_status()
        result = resp.json()

        log.info("[%s] Extraction done: fields_extracted=%d curated_path=%s",
                 params.get("correlation_id"), result.get("fields_extracted", 0), result.get("curated_path"))

        return result

    # ── Task 4: Validation ─────────────────────────────────────────────────
    def validation_task_fn(**context):
        params = context["params"]
        doc_id = params["document_id"]

        log.info("[%s] Validating document %s", params.get("correlation_id"), doc_id)

        payload = {
            "documentId": doc_id,
            "correlationId": params.get("correlation_id", ""),
        }

        resp = httpx.post(VALIDATE_URL, json=payload, headers=_headers(context), timeout=60)
        resp.raise_for_status()
        result = resp.json()

        log.info("[%s] Validation done: isValid=%s errors=%d warnings=%d",
                 params.get("correlation_id"), result.get("isValid"),
                 len(result.get("errors", [])), len(result.get("warnings", [])))

        return result

    # ── Task 5: Notify (update status to PROCESSED + persist documentType) ─
    def notify_task_fn(**context):
        params = context["params"]
        doc_id = params["document_id"]
        ti = context["task_instance"]

        document_type = ti.xcom_pull(task_ids="classification_task", key="document_type")

        log.info("[%s] Marking document %s as PROCESSED (type=%s)",
                 params.get("correlation_id"), doc_id, document_type)

        payload: dict = {"status": "PROCESSED", "updatedBy": "airflow-pipeline"}
        if document_type:
            payload["documentType"] = document_type

        resp = httpx.patch(
            f"{UPLOAD_URL}/{doc_id}/status",
            json=payload,
            headers=_headers(context),
            timeout=30,
        )
        resp.raise_for_status()
        log.info("[%s] Document %s marked PROCESSED", params.get("correlation_id"), doc_id)
        return {"document_id": doc_id, "status": "PROCESSED", "documentType": document_type}

    # ── Wire up tasks ──────────────────────────────────────────────────────
    t_ocr = PythonOperator(task_id="ocr_task", python_callable=ocr_task_fn)
    t_classify = PythonOperator(task_id="classification_task", python_callable=classification_task_fn)
    t_extract = PythonOperator(task_id="extraction_task", python_callable=extraction_task_fn)
    t_validate = PythonOperator(task_id="validation_task", python_callable=validation_task_fn)
    t_notify = PythonOperator(task_id="notify_task", python_callable=notify_task_fn)

    t_ocr >> t_classify >> t_extract >> t_validate >> t_notify
