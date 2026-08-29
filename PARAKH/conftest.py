import os
import sys
import pytest

# Ensure backend modules can be imported when running pytest from root
root_dir = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.join(root_dir, "backend")

for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.database.session import SessionLocal, engine
from app.models.base import Base
from app.models import User, Contract

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Autouse session-scoped fixture ensuring tables exist and minimal seed data is available."""
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        contract_count = db.query(Contract).count()
        if user_count == 0 or contract_count == 0:
            from backend.scripts.seed_demo import main as seed_main
            seed_main()
    finally:
        db.close()
    yield
