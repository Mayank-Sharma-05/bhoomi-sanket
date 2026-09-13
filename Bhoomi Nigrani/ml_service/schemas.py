from typing import List, Literal, Union, Dict, Any
from pydantic import BaseModel, Field

# Enumerations matching ML contract v1
ProjectType = Literal[
    "highway", "railway", "industrial", "power", "urban", "irrigation", "other"
]
FundingModel = Literal["government", "PPP", "private", "unknown"]
BudgetCroreBucket = Literal["small", "medium", "large", "very_large", "unknown"]
AcquisitionStage = Literal[
    "SIA", "SECTION_11", "SECTION_19", "AWARD", "POSSESSION", "RR", "CLOSED"
]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]
PredictionQuality = Literal["FULL", "PARTIAL", "DEGRADED", "STUB"]
TriggerEvent = Literal["CASE_UPDATE", "BATCH_REFRESH", "MANUAL"]
FactorDirection = Literal["INCREASES_RISK", "REDUCES_RISK"]
RecommendationCategory = Literal[
    "COMPENSATION", "LEGAL", "ADMINISTRATIVE", "RR", "DOCUMENTATION", "STAKEHOLDER"
]


class PredictionFeatures(BaseModel):
    # Project features
    project_type: ProjectType
    funding_model: FundingModel
    land_area_ha: float
    num_affected_families: int
    budget_crore_bucket: BudgetCroreBucket
    state_code: str
    district_id: int

    # Stage features
    current_stage: AcquisitionStage
    days_at_current_stage: int
    stage_deadline_ratio: float
    milestone_completion_rate: float

    # Legal features
    legal_cases_pending: int
    court_stay_active: int
    avg_dispute_age_days: float

    # Compensation features
    comp_disbursement_ratio: float
    comp_disputes_pending: int
    max_pending_days_comp: int

    # Rehabilitation features
    rr_plan_approved: int
    resettlement_ratio: float

    # Land record features
    clear_title_percent: float
    forest_land_involved: int
    tribal_area: int

    # Historical contextual features
    district_historical_delay_rate: float

    # Stakeholder features
    public_hearing_held: int
    objections_filed_count: int
    stakeholder_meetings_count: int


class PredictionRequest(BaseModel):
    case_id: str
    schema_version: Literal["v1"] = "v1"
    trigger: TriggerEvent
    requested_at: str
    features: PredictionFeatures


class SHAPFactor(BaseModel):
    feature: str
    value: Union[float, int, str]
    shap_value: float
    label: str
    direction: FactorDirection


class ActionRecommendation(BaseModel):
    priority: int
    category: RecommendationCategory
    action: str
    detail: str
    driven_by_feature: str


class PredictionResult(BaseModel):
    risk_probability: float
    risk_level: RiskLevel
    confidence: ConfidenceLevel


class ExplanationResult(BaseModel):
    base_probability: float
    top_factors: List[SHAPFactor] = Field(default_factory=list)


class PredictionMetadata(BaseModel):
    features_used: int
    features_missing: int
    missing_feature_names: List[str] = Field(default_factory=list)
    prediction_quality: PredictionQuality


class PredictionResponse(BaseModel):
    case_id: str
    predicted_at: str
    schema_version: Literal["v1"] = "v1"
    model_version: str
    prediction: PredictionResult
    explanation: ExplanationResult
    recommendations: List[ActionRecommendation] = Field(default_factory=list)
    metadata: PredictionMetadata


class BatchCaseItem(BaseModel):
    case_id: str
    features: PredictionFeatures


class BatchPredictionRequest(BaseModel):
    schema_version: Literal["v1"] = "v1"
    trigger: TriggerEvent
    requested_at: str
    cases: List[BatchCaseItem]


class BatchPredictionResponse(BaseModel):
    predicted_at: str
    model_version: str
    schema_version: Literal["v1"] = "v1"
    results: List[PredictionResponse]
    errors: List[Dict[str, str]] = Field(default_factory=list)


class ModelHealthResponse(BaseModel):
    status: Literal["ok", "degraded", "stub"]
    model_version: str
    uptime_seconds: float
    is_stub: bool


class ModelInfoResponse(BaseModel):
    model_version: str
    schema_version: Literal["v1"] = "v1"
    training_date: str
    feature_count: int
    risk_thresholds: Dict[str, float]
    base_probability: float
    is_stub: bool
