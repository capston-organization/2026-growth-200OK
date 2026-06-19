import os
from dotenv import load_dotenv

load_dotenv()

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/capston"
)

# ── Gemini ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_BASE_URL: str = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)

# ── Corpus defaults ───────────────────────────────────────────────────────────
DEFAULT_MAX_SENTENCES: int = int(os.getenv("DEFAULT_MAX_SENTENCES", "5000"))
