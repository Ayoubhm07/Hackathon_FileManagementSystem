# airflow-pipeline

Apache Airflow 2.7 DAG for DocFlow document processing.

## DAG: `docflow_pipeline`

```
ocr_task → classification_task → extraction_task → validation_task → notify_task
```

| Setting | Value |
|---------|-------|
| Retries | 3 |
| Retry delay | 30s |
| Task timeout | 10min |
| On failure | Sets document status = FAILED |
| Trigger | REST API (upload-service calls POST /api/v1/dags/docflow_pipeline/dagRuns) |

## XCom flow

- `ocr_task` pushes `clean_path`
- `classification_task` pulls `clean_path`, pushes `document_type`
- `extraction_task` pulls both `clean_path` and `document_type`
