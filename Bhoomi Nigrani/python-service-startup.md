# Python ML Service Startup

Create and activate a Python virtual environment:

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn ml_service.main:app --host 127.0.0.1 --port 8000 --reload

The service exposes:
POST /predict
POST /what-if
GET /district-risk
GET /state-risk
GET /project-map-data
