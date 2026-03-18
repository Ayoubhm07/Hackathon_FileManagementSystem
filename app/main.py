from fastapi import FastAPI
from app.routes.upload import router as upload_router

app = FastAPI(title="File Upload Service")
app.include_router(upload_router)