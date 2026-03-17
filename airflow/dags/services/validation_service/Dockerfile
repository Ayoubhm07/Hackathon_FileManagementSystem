FROM python:3.11-slim

WORKDIR /app

COPY airflow/dags/services/validation_service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --retries 8 --timeout 120 -r /tmp/requirements.txt

COPY shared/ /app/shared/
COPY airflow/dags/services/validation_service/app/ /app/app/

ENV LOG_LEVEL="INFO"

EXPOSE 8002
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
