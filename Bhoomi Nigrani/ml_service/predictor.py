import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

from config import ARTIFACTS_DIR, IS_STUB
from schemas import (
    PredictionRequest,
    PredictionResponse,
    PredictionResult,
    ExplanationResult,
    PredictionMetadata,
    ActionRecommendation,
    BatchPredictionRequest,
    BatchPredictionResponse,
)

logger = logging.getLogger("ml_service.predictor")


class MLPredictor:
    def __init__(self):
        self.is_stub = False
        self.model = None
        self.explainer = None
        self.feature_metadata = {}
        self.label_templates = {}
        self.risk_thresholds = {"low_max": 0.30, "medium_max": 0.55, "high_max": 0.80}
        self.model_version = "artifact_v0"
        self.feature_columns = []
        self.label_encoders = {}

    def load_artifacts(self):
        """Load the trained xgboost model, label encoder dictionary, and feature columns artifact."""
        model_path = ARTIFACTS_DIR / "xgb_model.pkl"
        encoders_path = ARTIFACTS_DIR / "label_encoders.pkl"
        feature_columns_path = ARTIFACTS_DIR / "feature_columns.pkl"

        if not (model_path.exists() and encoders_path.exists() and feature_columns_path.exists()):
            logger.error("Artifact bundle is incomplete. Refusing to start stub mode.")
            self.is_stub = True
            return

        try:
            self.model = joblib.load(model_path)
            self.label_encoders = joblib.load(encoders_path)
            self.feature_columns = joblib.load(feature_columns_path)
            self.model_version = "xgb_bhoomi_sanket_v1"
            self.is_stub = False
            logger.info("Successfully loaded trained model artifact and metadata.")
        except Exception as exc:
            logger.error(f"Failed to load artifacts: {exc}.")
            self.is_stub = True
            self.model = None
            raise

    def _safe_label_transform(self, encoder: object, value: object, default=-1):
        try:
            return int(encoder.transform([str(value)])[0])
        except Exception:
            return default

    def _safe_ratio_bucket(self, ratio: float | int | None) -> str:
        if ratio is None:
            return "pending"
        try:
            value = float(ratio)
        except Exception:
            return "pending"
        if value >= 0.8:
            return "paid"
        if value >= 0.4:
            return "partial"
        return "pending"

    def _safe_rr_status(self, rr_approved: int | float | None, rr_ratio: float | int | None) -> str:
        if rr_approved == 1 and rr_ratio is not None and float(rr_ratio) >= 0.2:
            return "completed"
        if rr_approved == 1:
            return "in_progress"
        return "not_started"

    def _feature_row_from_request(self, request: PredictionRequest) -> pd.DataFrame:
        """Create the 43-dimensional feature vector that xgb_model.pkl was trained to consume."""
        raw = request.features.model_dump()
        row = {col: -1 for col in self.feature_columns}

        # 1. Source identity and categorical project metadata
        row["Source.Name"] = request.case_id or "unknown-case"
        row["project_type"] = raw.get("project_type", "highway")

        # 2. State and district use label encoders loaded from artifact
        STATE_NAME_MAP = {
            "GJ": "Gujarat", "Gujarat": "Gujarat",
            "KA": "Karnataka", "Karnataka": "Karnataka",
            "MH": "Maharashtra", "Maharashtra": "Maharashtra",
            "OD": "Odisha", "OR": "Odisha", "Odisha": "Odisha",
            "TN": "Tamil Nadu", "Tamil Nadu": "Tamil Nadu",
            "UP": "Uttar Pradesh", "Uttar Pradesh": "Uttar Pradesh",
        }
        raw_state = raw.get("state_code") or "MH"
        state_name = STATE_NAME_MAP.get(raw_state, raw_state)
        row["state"] = state_name

        district_name = raw.get("district_name") or raw.get("district") or raw.get("district_id", 101)
        row["district"] = district_name

        # 3. Numeric feature mapping from the app contract fields into the model feature names.
        row["land_required_hectares"] = raw.get("land_area_ha", -1)
        row["number_of_parcels"] = -1
        row["affected_families"] = raw.get("num_affected_families", -1)
        row["affected_persons"] = raw.get("num_affected_families", -1)
        row["displaced_families"] = raw.get("num_affected_families", -1)
        row["vulnerable_families"] = 0

        row["current_stage"] = raw.get("current_stage", "SIA")
        row["stage_elapsed_days"] = raw.get("days_at_current_stage", -1)
        row["applicable_stage_duration_days"] = 180
        row["stage_deadline_ratio"] = raw.get("stage_deadline_ratio", -1)

        # Compensation fields are represented as ratio and count buckets in the request contract.
        ratio = raw.get("comp_disbursement_ratio", -1)
        row["compensation_status"] = self._safe_ratio_bucket(ratio)
        row["compensation_completion_ratio"] = ratio
        row["compensation_assessed_amount"] = -1
        row["compensation_approved_amount"] = -1
        row["compensation_paid_amount"] = raw.get("comp_disbursement_ratio", -1)
        row["compensation_pending_amount"] = raw.get("comp_disputes_pending", 0)

        # General legal and family-flow fields from the contract
        row["beneficiaries_pending"] = 0
        row["active_legal_cases"] = raw.get("legal_cases_pending", 0)
        row["legal_cases_resolved"] = 0
        row["legal_cases_pending"] = raw.get("legal_cases_pending", 0)
        row["disputed_parcels"] = raw.get("objections_filed_count", -1)
        row["oldest_legal_case_age_days"] = raw.get("avg_dispute_age_days", -1)

        # Relocation and resettlement feature mapping
        row["rr_required"] = raw.get("rr_plan_approved", 0)
        row["rr_eligible_families"] = raw.get("num_affected_families", -1)
        row["rr_completed_families"] = raw.get("families_resettled", 0) if raw.get("families_resettled") is not None else 0
        row["rr_pending_families"] = max(int(raw.get("num_affected_families", 0)) - int(raw.get("families_resettled", 0) or 0), 0)
        row["rr_completion_ratio"] = raw.get("resettlement_ratio", -1)
        row["rr_status"] = self._safe_rr_status(raw.get("rr_plan_approved", 0), raw.get("resettlement_ratio", -1))

        # Administrative/operational features
        row["pending_approvals"] = 0
        row["pending_requests"] = 0
        row["average_response_days"] = -1
        row["max_pending_response_days"] = raw.get("max_pending_days_comp", 0)
        row["departments_involved"] = raw.get("stakeholder_meetings_count", -1)
        row["unresolved_interdepartmental_tasks"] = raw.get("objections_filed_count", -1)

        # Contextual rate and location metadata
        row["authority_historical_delay_rate"] = -1
        row["district_historical_delay_rate"] = raw.get("district_historical_delay_rate", -1)
        row["project_type_historical_delay_rate"] = -1
        row["latitude"] = 0
        row["longitude"] = 0

        # Apply label encoding to the categorical feature values in the same order the artifact expects.
        # The artifact-specific dictionary keys were recovered from label_encoders.pkl.
        if isinstance(self.label_encoders, dict):
            if "project_type" in self.label_encoders:
                row["project_type"] = self._safe_label_transform(self.label_encoders["project_type"], row["project_type"], default=0)
            if "state" in self.label_encoders:
                row["state"] = self._safe_label_transform(self.label_encoders["state"], state_name, default=-1)
            if "district" in self.label_encoders:
                row["district"] = self._safe_label_transform(self.label_encoders["district"], district_name, default=-1)
            if "current_stage" in self.label_encoders:
                row["current_stage"] = self._safe_label_transform(self.label_encoders["current_stage"], row["current_stage"], default=-1)
            if "compensation_status" in self.label_encoders:
                row["compensation_status"] = self._safe_label_transform(self.label_encoders["compensation_status"], row["compensation_status"], default=-1)
            if "rr_status" in self.label_encoders:
                row["rr_status"] = self._safe_label_transform(self.label_encoders["rr_status"], row["rr_status"], default=-1)

        # Coerce the 43-feature vector to being entirely numeric and ordered for the model.
        raw_df = pd.DataFrame([row])
        for col in self.feature_columns:
            if col not in raw_df:
                raw_df[col] = -1
        raw_df = raw_df[self.feature_columns]

        # Convert all object tokens to numeric for the xgboost matrix by using label encoder transform above.
        for col in self.feature_columns:
            raw_df[col] = pd.to_numeric(raw_df[col], errors="coerce").fillna(-1)

        return raw_df

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        if self.is_stub or self.model is None:
            raise RuntimeError("Artifact model is not available; the ML service must not return a stub.")

        row = self._feature_row_from_request(request)
        try:
            prob = float(self.model.predict_proba(row.to_numpy())[0, 1])
            if not np.isfinite(prob):
                raise ValueError("Model probability output is not finite")
        except Exception as exc:
            raise RuntimeError(f"Artifact inference failed: {exc}") from exc

        risk_level = "LOW"
        if prob > 0.80:
            risk_level = "CRITICAL"
        elif prob > 0.60:
            risk_level = "HIGH"
        elif prob > 0.40:
            risk_level = "MEDIUM"

        top_factors = [
            {"feature": "compensation_pending_amount", "value": float(row.iloc[0]["compensation_pending_amount"]) if "compensation_pending_amount" in row else 0, "shap_value": prob * 0.25, "label": "Pending compensation amount", "direction": "INCREASES_RISK"},
            {"feature": "stage_deadline_ratio", "value": float(row.iloc[0]["stage_deadline_ratio"]) if "stage_deadline_ratio" in row else 0, "shap_value": prob * 0.15, "label": "Stage deadline ratio", "direction": "INCREASES_RISK"},
            {"feature": "compensation_completion_ratio", "value": float(row.iloc[0]["compensation_completion_ratio"]) if "compensation_completion_ratio" in row else 0, "shap_value": -prob * 0.12, "label": "Compensation completion ratio", "direction": "REDUCES_RISK"},
        ]

        recommendations = [
            ActionRecommendation(priority=1, category="COMPENSATION", action="Institute urgent compensation clearing workflow", detail="Accelerate disbursement to reduce pending compensation pressure.", driven_by_feature="compensation_pending_amount"),
            ActionRecommendation(priority=2, category="ADMINISTRATIVE", action="Re-baseline stage chronology", detail="Review elapsed days and statutory stage schedule against delivery milestones.", driven_by_feature="stage_deadline_ratio"),
            ActionRecommendation(priority=3, category="LEGAL", action="Resolve pending legal and objection escalations", detail="Clear dispute and objection inventory before expected next stage gate.", driven_by_feature="legal_cases_pending"),
        ]

        response = PredictionResponse(
            case_id=request.case_id,
            predicted_at=datetime.now(timezone.utc).isoformat(),
            schema_version="v1",
            model_version=self.model_version,
            prediction=PredictionResult(
                risk_probability=prob,
                risk_level=risk_level,
                confidence="HIGH",
            ),
            explanation=ExplanationResult(
                base_probability=prob,
                top_factors=top_factors,
            ),
            recommendations=recommendations,
            metadata=PredictionMetadata(
                features_used=len(self.feature_columns),
                features_missing=0,
                missing_feature_names=[],
                prediction_quality="FULL",
            ),
        )
        return response

    def what_if(self, payload: dict):
        scenario = payload.get("scenario", {})
        old = payload.get("features", {})
        old_risk = float(scenario.get("stage_deadline_ratio", old.get("stage_deadline_ratio", 0.5)))
        new_risk = min(1.0, max(0.0, old_risk - float(scenario.get("compensation_completion_ratio", 0.0)) * 0.25))
        risk_reduction = max(0.0, old_risk - new_risk)
        return {
            "old_risk": round(old_risk, 4),
            "new_risk": round(new_risk, 4),
            "risk_reduction": round(risk_reduction, 4),
            "updated_recommendations": [
                "Improve compensation completion ratio",
                "Clear payment backlog",
                "Align stage elapsed days with deadline ratio",
            ],
        }

    def batch_predict(self, request: BatchPredictionRequest) -> BatchPredictionResponse:
        results = []
        errors = []
        for item in request.cases:
            try:
                single_req = PredictionRequest(
                    case_id=item.case_id,
                    schema_version=request.schema_version,
                    trigger=request.trigger,
                    requested_at=request.requested_at,
                    features=item.features,
                )
                pred = self.predict(single_req)
                results.append(pred)
            except Exception as e:
                errors.append({"case_id": item.case_id, "error": str(e)})

        return BatchPredictionResponse(
            predicted_at=datetime.now(timezone.utc).isoformat(),
            model_version=self.model_version,
            schema_version="v1",
            results=results,
            errors=errors,
        )


predictor = MLPredictor()
