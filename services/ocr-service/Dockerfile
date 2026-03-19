FROM python:3.11-slim AS base

# Install system deps: Tesseract + French language pack + OpenCV + Poppler (PDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── development ──────────────────────────────────────────────────────────────
FROM base AS development
COPY . .
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# ── production ───────────────────────────────────────────────────────────────
FROM base AS production
COPY app/ ./app/
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g 1001 -m -s /bin/sh appuser
USER appuser
EXPOSE 8001
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:8001/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
