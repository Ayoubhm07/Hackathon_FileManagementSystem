from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    document_id: str
    clean_text_path: str
    correlation_id: str = ""


class ClassifyResponse(BaseModel):
    document_id: str
    document_type: str
    confidence: float
    method: str  # "ml" or "keyword"
