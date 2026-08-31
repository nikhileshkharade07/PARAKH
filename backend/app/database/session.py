from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def _create_db_engine():
    db_url = settings.database_url
    if db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    try:
        connect_args = {"connect_timeout": 2} if "psycopg" in db_url else {}
        eng = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        logger.warning(f"Database connection to {db_url} failed ({e}). Falling back to SQLite.")
        return create_engine("sqlite:///./parakh.db", connect_args={"check_same_thread": False})

engine = _create_db_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
