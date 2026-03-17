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
    """Download a text file from MinIO and return its content as a string."""
    response = _client.get_object(Bucket=bucket, Key=key)
    return response["Body"].read().decode("utf-8")
