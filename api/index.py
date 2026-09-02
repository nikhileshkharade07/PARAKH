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

# In serverless environments (e.g. Vercel/AWS Lambda), /var/task is read-only.
# Copy parakh.db to /tmp/parakh.db so writes (cases, notes, evidence) succeed without error.
if os.path.exists(db_path):
    target_db = db_path
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_db = "/tmp/parakh.db"
        if not os.path.exists(tmp_db) or os.path.getsize(tmp_db) == 0:
            import shutil
            try:
                shutil.copyfile(db_path, tmp_db)
                target_db = tmp_db
            except Exception as e:
                pass
        else:
            target_db = tmp_db
            
    db_abs = os.path.abspath(target_db).replace("\\", "/")
    os.environ["DATABASE_URL"] = f"sqlite:///{db_abs}"

from backend.app.main import app

