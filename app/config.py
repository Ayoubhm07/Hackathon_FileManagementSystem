import os 
from dotenv import load_dotenv

load_dotenv()  # Charger les variables d'environnement depuis le fichier .env

class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI")
    MONGODB_DB = os.getenv("MONGODB_DB", "hackathon_db")
    MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "documents")

    #RAW_FOLDER = os.getenv("RAW_FOLDER", "datalake/raw")
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "datalake")
    MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

# instance de la classe settings pour être utilisée dans l'application  
settings = Settings()