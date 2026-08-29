import os
import sys

# Ensure backend directory is in sys.path
root_dir = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.ml.evaluate_model import run_model_evaluation

if __name__ == "__main__":
    run_model_evaluation()
