"""
Airflow failure callbacks — update document status to FAILED in MongoDB.
"""
from __future__ import annotations

import logging
import os

import httpx

log = logging.getLogger(__name__)

UPLOAD_SERVICE_URL = os.getenv("UPLOAD_SERVICE_URL", "http://upload-service:3001")


def on_dag_failure(context: dict) -> None:
    """
    Called when any task in the DAG fails after all retries.
    Sets the document status to FAILED via upload-service PATCH endpoint.
    """
    params = context.get("params", {})
    doc_id = params.get("document_id", "")
    correlation_id = params.get("correlation_id", "")
    task_id = context.get("task_instance_key_str", "unknown")

    if not doc_id:
        log.warning("on_dag_failure: no document_id in params, skipping status update")
        return

    log.error("[%s] Pipeline FAILED at task %s for document %s", correlation_id, task_id, doc_id)

    try:
        resp = httpx.patch(
            f"{UPLOAD_SERVICE_URL}/documents/{doc_id}/status",
            json={"status": "FAILED", "updatedBy": f"airflow/{task_id}"},
            headers={"X-Correlation-Id": correlation_id, "Content-Type": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        log.info("[%s] Document %s marked FAILED", correlation_id, doc_id)
    except Exception as exc:
        log.error("[%s] Failed to update document %s status to FAILED: %s", correlation_id, doc_id, exc)
