"""MongoDB upsert for extracted entities — idempotent for Airflow retries."""
from pymongo import MongoClient, UpdateOne
from app.config import settings
from app.logger import logger

_client: MongoClient | None = None


def _get_db():
    global _client
    if _client is None:
        _client = MongoClient(settings.mongo_uri)
    return _client.get_default_database()


def upsert_entity(document_id: str, entities: dict) -> None:
    db = _get_db()
    result = db.extracted_entities.update_one(
        {"documentId": document_id},
        {"$set": {**entities, "documentId": document_id}},
        upsert=True,
    )
    logger.info("entity_upserted", document_id=document_id, matched=result.matched_count, upserted=result.upserted_id is not None)


def get_entity(document_id: str) -> dict | None:
    db = _get_db()
    doc = db.extracted_entities.find_one({"documentId": document_id}, {"_id": 0})
    return doc
