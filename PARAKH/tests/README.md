# PARAKH Test Suite

Run the full automated test suite with:

```bash
python -m pytest
```

### Coverage Structure

- **`tests/test_backend/`**:
  - `test_health.py`: Health check endpoint verification (`/health`).
  - `test_api.py`: Integration smoke tests for `/api/contracts`, `/api/departments`, `/api/vendors`, `/api/dashboard/stats`, `/api/network`, `/api/nlp/analyze`, `/api/blockchain/record`.
- **`tests/test_ml/`**:
  - `test_nlp.py`: TF-IDF vectorization and Cosine Similarity threshold testing (RF-7 specification similarity).
  - `test_rules.py`: Heuristic evaluations for RF-1 (single bid), RF-3 (threshold pattern), RF-4 (compressed window), RF-5 (price deviation), RF-8 (unusual extensions).
