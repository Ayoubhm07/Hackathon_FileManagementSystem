from pydantic import BaseModel


class OcrRequest(BaseModel):
    document_id: str
    storage_path: str
    mime_type: str
    correlation_id: str = ""


class OcrResponse(BaseModel):
    document_id: str
    storage_path: str
    clean_path: str
    text_length: int
    status: str = "completed"
