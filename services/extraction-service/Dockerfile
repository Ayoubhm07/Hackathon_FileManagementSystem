FROM python:3.11-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Download French spaCy model (pinned to match spacy==3.7.2)
RUN pip install --no-cache-dir https://github.com/explosion/spacy-models/releases/download/fr_core_news_sm-3.7.0/fr_core_news_sm-3.7.0-py3-none-any.whl

FROM base AS development
COPY . .
EXPOSE 8003
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]

FROM base AS production
COPY app/ ./app/
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g 1001 -m -s /bin/sh appuser
USER appuser
EXPOSE 8003
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:8003/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003", "--workers", "2"]
