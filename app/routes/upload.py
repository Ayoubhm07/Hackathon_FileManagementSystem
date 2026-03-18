import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.metadata import save_document_metadata
from app.services.storage import upload_bytes_to_raw

router = APIRouter()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        document_id = str(uuid.uuid4())
        stored_filename = f"{document_id}_{file.filename}"
        object_name = f"raw/{stored_filename}"

        content = await file.read()

        storage_result = upload_bytes_to_raw(
            file_bytes=content,
            object_name=object_name,
            content_type=file.content_type or "application/octet-stream"
        )

        metadata = {
            "document_id": document_id,
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "storage_path": f"s3://{storage_result['bucket']}/{object_name}",
            "bucket": storage_result["bucket"],
            "object_name": object_name,
            "zone": "raw",
            "status": "uploaded",
            "processing_status": "pending",
            "uploaded_at": datetime.utcnow().isoformat()
        }

        save_document_metadata(metadata.copy())

        return {
            "message": "Upload réussi",
            "document": metadata
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))