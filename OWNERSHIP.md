# PARAKH Module Ownership

| Person | Primary ownership | Main paths |
|---|---|---|
| 1 | Backend + architecture + integration | `backend/app/` |
| 2 | Frontend + dashboard + investigation UI | `frontend/src/` |
| 3 | AI/ML + risk engine + NLP | `backend/ml/` |
| 4 | Network + vendor/department investigation | `frontend/src/` network/profile work + `backend/app/api/routes/network.py` |
| 5 | Data + QA + deployment + backup | `backend/scripts/`, `data/`, `tests/`, Docker |
| 6 | Research + UX + PPT + pitch | `docs/`, UX review, presentation |

## Integration rule

Each primary owner may edit shared integration files only through a PR and should notify the other owner first.

### Shared contracts

- Backend API shapes are documented in `docs/api.md`.
- Database models are under `backend/app/models/`.
- Frontend calls the API through `frontend/src/services/api.js`.
- Risk flag IDs and weights are defined in `backend/ml/risk_engine/rules.py`.

## First parallel split

- Person 1: backend health + database + API skeleton.
- Person 2: dashboard shell and routes.
- Person 3: risk engine and tests.
- Person 4: Cytoscape network component.
- Person 5: seed data + test runner + Docker.
