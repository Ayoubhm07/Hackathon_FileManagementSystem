import io
import json
import boto3
from botocore.exceptions import ClientError
from app.config import settings
from app.logger import logger


def _make_client() -> boto3.client:
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if settings.minio_use_ssl else 'http'}://{settings.minio_endpoint}",
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
    )


_client = _make_client()


def download_text(bucket: str, key: str) -> str:
    response = _client.get_object(Bucket=bucket, Key=key)
    return response["Body"].read().decode("utf-8")


def upload_json(bucket: str, key: str, data: dict) -> None:
    try:
        _client.head_bucket(Bucket=bucket)
    except ClientError:
        _client.create_bucket(Bucket=bucket)
        logger.info("minio_bucket_created", bucket=bucket)

    body = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    _client.put_object(Bucket=bucket, Key=key, Body=io.BytesIO(body), ContentType="application/json")
    logger.info("minio_json_uploaded", bucket=bucket, key=key)
