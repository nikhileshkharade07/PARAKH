import os
import sys

# Ensure root and backend directories are in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Determine database path
db_path = os.path.join(root_dir, "parakh.db")
if not os.path.exists(db_path):
    alt_db = os.path.join(root_dir, "PARAKH", "parakh.db")
    if os.path.exists(alt_db):
        db_path = alt_db

# Configure database URL with read-only SQLite URI to ensure 100% serverless concurrency
if os.path.exists(db_path):
    db_abs = os.path.abspath(db_path).replace("\\", "/")
    os.environ["DATABASE_URL"] = f"sqlite:///{db_abs}"

from backend.app.main import app
