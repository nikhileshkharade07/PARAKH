import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for path in (root_dir, backend_dir):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))
