import io
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


_client: boto3.client = None  # type: ignore


def _get_client() -> boto3.client:
    global _client
    if _client is None:
        _client = _make_client()
    return _client


def download_object(bucket: str, key: str) -> bytes:
    """Download a file from MinIO and return its bytes."""
    response = _get_client().get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


def upload_object(bucket: str, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    """Upload bytes to MinIO, creating the bucket if necessary."""
    client = _get_client()
    try:
        client.head_bucket(Bucket=bucket)
    except ClientError:
        client.create_bucket(Bucket=bucket)
        logger.info("minio_bucket_created", bucket=bucket)

    client.put_object(Bucket=bucket, Key=key, Body=io.BytesIO(data), ContentType=content_type)
    logger.info("minio_upload_ok", bucket=bucket, key=key, size=len(data))
