import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from config import ML_SERVICE_SECRET, SCHEMA_VERSION, PORT
from schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    ModelHealthResponse,
    ModelInfoResponse,
)
from predictor import predictor

START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor.load_artifacts()
    yield


app = FastAPI(
    title="Bhoomi Sanket ML Inference Service",
    description="Model-agnostic inference API for land acquisition delay prediction and SHAP factor attribution.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Internal security dependency
def verify_internal_secret(x_internal_token: str = Header(None)):
    if ML_SERVICE_SECRET and ML_SERVICE_SECRET != "dev-secret-local-only":
        if x_internal_token != ML_SERVICE_SECRET:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid internal authorization secret.",
            )
    return True


@app.get("/health", response_model=ModelHealthResponse)
def health_check():
    uptime = time.time() - START_TIME
    return ModelHealthResponse(
        status="stub" if predictor.is_stub else "ok",
        model_version=predictor.model_version,
        uptime_seconds=round(uptime, 2),
        is_stub=predictor.is_stub,
    )


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info():
    return ModelInfoResponse(
        model_version=predictor.model_version,
        schema_version=SCHEMA_VERSION,
        training_date=predictor.feature_metadata.get("training_date", "Unknown"),
        feature_count=len(predictor.feature_columns),
        risk_thresholds=predictor.risk_thresholds,
        base_probability=0.50,
        is_stub=predictor.is_stub,
    )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    dependencies=[Depends(verify_internal_secret)],
)
def predict_delay_risk(request: PredictionRequest):
    if request.schema_version != SCHEMA_VERSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported schema version: {request.schema_version}. Expected: {SCHEMA_VERSION}",
        )
    return predictor.predict(request)


@app.post("/what-if", dependencies=[Depends(verify_internal_secret)])
def what_if(request: dict):
    return predictor.what_if(request)


@app.get("/district-risk")
def district_risk():
    import pandas as pd
    from pathlib import Path
    path = Path(__file__).resolve().parent.parent / "data" / "district_risk.csv"
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


@app.get("/state-risk")
def state_risk():
    import pandas as pd
    from pathlib import Path
    path = Path(__file__).resolve().parent.parent / "data" / "state_risk.csv"
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


@app.get("/project-map-data")
def project_map_data():
    import pandas as pd
    from pathlib import Path
    path = Path(__file__).resolve().parent.parent / "data" / "project_map_data.csv"
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


@app.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    dependencies=[Depends(verify_internal_secret)],
)
def batch_predict_delay_risk(request: BatchPredictionRequest):
    if request.schema_version != SCHEMA_VERSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported schema version: {request.schema_version}. Expected: {SCHEMA_VERSION}",
        )
    return predictor.batch_predict(request)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
