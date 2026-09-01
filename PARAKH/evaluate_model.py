"""
evaluate_model.py
-----------------
Entry point to run the scientific PARAKH benchmark evaluation suite.
"""

import os
import sys

root_dir = os.path.abspath(os.path.dirname(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from benchmark.evaluate_benchmark import execute_full_benchmark_suite

if __name__ == "__main__":
    execute_full_benchmark_suite()
