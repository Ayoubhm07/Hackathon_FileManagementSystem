from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # INSEE OAuth2 credentials — register on https://portail-api.insee.fr/
    insee_client_id: str = ""
    insee_client_secret: str = ""
    insee_token_url: str = "https://portail-api.insee.fr/token"
    insee_sirene_base: str = "https://api.insee.fr/api-sirene/3.11"

    # Circuit breaker / rate limit
    insee_request_timeout: int = 8          # seconds
    insee_max_retries: int = 2
    insee_cache_ttl: int = 3600             # seconds
    insee_rate_limit_per_min: int = 30

    mongodb_uri: str = "mongodb://mongodb:27017"
    mongodb_db: str = "docplatform"

    log_level: str = "INFO"

    model_config = {"env_file": ".env"}


settings = Settings()
