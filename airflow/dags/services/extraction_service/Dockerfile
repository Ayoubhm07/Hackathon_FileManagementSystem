FROM python:3.11-slim

WORKDIR /app

ARG INSTALL_ML=false

# System deps for OpenCV + Tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY airflow/dags/services/extraction_service/requirements.txt /tmp/requirements.txt
COPY airflow/dags/services/extraction_service/requirements-ml.txt /tmp/requirements-ml.txt
RUN pip install --no-cache-dir --retries 8 --timeout 120 -r /tmp/requirements.txt
RUN if [ "$INSTALL_ML" = "true" ]; then \
            pip install --no-cache-dir --retries 8 --timeout 120 -r /tmp/requirements-ml.txt; \
        else \
            echo "Skipping optional ML dependencies (INSTALL_ML=false)"; \
        fi

# Add shared schemas
COPY shared/ /app/shared/
# Add service code
COPY airflow/dags/services/extraction_service/app/ /app/app/

# YOLOv8 model weights (mount via volume or bake in)
# COPY models/extraction_best.pt /app/models/extraction_best.pt

ENV YOLO_MODEL_PATH=""
ENV LOG_LEVEL="INFO"

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
