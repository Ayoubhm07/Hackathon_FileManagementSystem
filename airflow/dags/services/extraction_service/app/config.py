from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    yolo_model_path: str = ""          # empty → text-only mode
    spacy_model: str = "fr_core_news_md"
    confidence_threshold: float = 0.4
    log_level: str = "INFO"

    model_config = {"env_file": ".env"}


settings = Settings()
