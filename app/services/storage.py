from minio import Minio
from app.config import settings

client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

def ensure_bucket():
    if not client.bucket_exists(settings.MINIO_BUCKET):
        client.make_bucket(settings.MINIO_BUCKET)

def upload_bytes_to_raw(file_bytes: bytes, object_name: str, content_type: str):
    ensure_bucket()

    from io import BytesIO
    data = BytesIO(file_bytes)

    result = client.put_object(
        settings.MINIO_BUCKET,
        object_name,
        data,
        length=len(file_bytes),
        content_type=content_type
    )
    return {
        "bucket": settings.MINIO_BUCKET,
        "object_name": object_name,
        "etag": result.etag,
        "version_id": result.version_id,
    }