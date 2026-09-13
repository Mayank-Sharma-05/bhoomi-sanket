import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = Path(os.getenv("ARTIFACTS_DIR", BASE_DIR / "artifacts"))
ML_SERVICE_SECRET = os.getenv("ML_SERVICE_SECRET", "dev-secret-local-only")
IS_STUB = os.getenv("IS_STUB", "false").lower() in ("true", "1", "yes")
PORT = int(os.getenv("PORT", "8000"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")
SCHEMA_VERSION = "v1"
