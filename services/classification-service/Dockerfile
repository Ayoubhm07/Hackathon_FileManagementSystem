FROM python:3.11-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS development
COPY . .
EXPOSE 8002
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]

FROM base AS production
COPY app/ ./app/
RUN mkdir -p /app/models
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g 1001 -m -s /bin/sh appuser
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8002
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:8002/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "2"]
