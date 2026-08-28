import os
import sys

# Ensure backend modules can be imported when running pytest from root
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
