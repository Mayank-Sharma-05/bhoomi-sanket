from datetime import datetime, timezone
from schemas import (
    PredictionRequest,
    PredictionResponse,
    PredictionResult,
    ExplanationResult,
    PredictionMetadata,
    ActionRecommendation,
)


def generate_stub_prediction(request: PredictionRequest) -> PredictionResponse:
    """
    Generate neutral development stub response.
    Never claims trained accuracy; explicitly sets prediction_quality to 'STUB'.
    """
    feature_dict = request.features.model_dump()
    missing_features = [k for k, v in feature_dict.items() if v == -1]
    features_used = len(feature_dict) - len(missing_features)

    now_iso = datetime.now(timezone.utc).isoformat()

    recommendation = ActionRecommendation(
        priority=1,
        category="ADMINISTRATIVE",
        action="Development Stub Active",
        detail="The ML service is operating in stub mode. Real predictions require a separately trained model artifact.",
        driven_by_feature="system_mode",
    )

    return PredictionResponse(
        case_id=request.case_id,
        predicted_at=now_iso,
        schema_version="v1",
        model_version="stub_v0",
        prediction=PredictionResult(
            risk_probability=0.50,
            risk_level="MEDIUM",
            confidence="MEDIUM",
        ),
        explanation=ExplanationResult(
            base_probability=0.50,
            top_factors=[],
        ),
        recommendations=[recommendation],
        metadata=PredictionMetadata(
            features_used=features_used,
            features_missing=len(missing_features),
            missing_feature_names=missing_features,
            prediction_quality="STUB",
        ),
    )
