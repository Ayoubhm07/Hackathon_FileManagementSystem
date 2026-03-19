FROM apache/airflow:2.7.3-python3.11

USER root
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*
USER airflow

COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt

COPY dags/ ${AIRFLOW_HOME}/dags/

HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD wget -qO- http://localhost:8080/health || exit 1
