from pydantic import BaseModel


class ExtractRequest(BaseModel):
    document_id: str
    clean_text_path: str
    document_type: str
    correlation_id: str = ""


class ExtractResponse(BaseModel):
    document_id: str
    document_type: str
    curated_path: str
    fields_extracted: int
