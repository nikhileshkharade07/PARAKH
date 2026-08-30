# Architecture

PARAKH uses one FastAPI process, one PostgreSQL database and one React application.

The ML modules are Python modules inside the backend, not separate services.

- `app/models`: database persistence
- `app/schemas`: API response/request shapes
- `app/api`: HTTP layer
- `ml/risk_engine`: explainable rules + CRS
- `ml/anomaly_detection`: Isolation Forest
- `ml/nlp`: TF-IDF similarity
- `frontend`: presentation layer
