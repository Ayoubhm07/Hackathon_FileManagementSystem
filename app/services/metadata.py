from pymongo import MongoClient
from app.config import settings


client = MongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB]
collection = db[settings.MONGODB_COLLECTION]

def save_document_metadata(metadata: dict):
    metadata_to_save = metadata.copy()  # Créer une copie pour éviter de modifier l'original
    result = collection.insert_one(metadata_to_save) # Enregistrer les métadonnées dans MongoDB
    return str(result.inserted_id)

def get_all_documents():
    docs = list(collection.find())  # Récupérer tous les documents
    for doc in docs:
        doc["_id"] = str(doc["_id"])  # Convertir l'ObjectId en string pour la sérialisation
    return docs