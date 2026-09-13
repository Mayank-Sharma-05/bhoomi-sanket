"""
Unit tests for Bhoomi Sanket FastAPI ML Service.
Tests /health, /model-info, and /predict endpoints against the artifact-backed predictor stack.
"""

from fastapi.testclient import TestClient
from main import app


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "stub")
    assert "model_version" in data
    assert "uptime_seconds" in data


def test_model_info_endpoint():
    with TestClient(app) as client:
        response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["schema_version"] == "v1"
    assert data["feature_count"] == 43
    assert data["model_version"] == "xgb_bhoomi_sanket_v1"
    assert "risk_thresholds" in data


def test_predict_stub_mode():
    sample_request = {
        "case_id": "test-case-uuid-1234",
        "schema_version": "v1",
        "trigger": "CASE_UPDATE",
        "requested_at": "2026-09-11T19:00:00Z",
        "features": {
            "project_type": "highway",
            "funding_model": "government",
            "land_area_ha": 250.0,
            "num_affected_families": 450,
            "budget_crore_bucket": "medium",
            "state_code": "UP",
            "district_id": 101,
            "current_stage": "SECTION_11",
            "days_at_current_stage": 45,
            "stage_deadline_ratio": 0.25,
            "milestone_completion_rate": -1,
            "legal_cases_pending": 0,
            "court_stay_active": 0,
            "avg_dispute_age_days": -1,
            "comp_disbursement_ratio": -1,
            "comp_disputes_pending": 0,
            "max_pending_days_comp": 0,
            "rr_plan_approved": 0,
            "resettlement_ratio": -1,
            "clear_title_percent": 85.0,
            "forest_land_involved": 0,
            "tribal_area": 0,
            "district_historical_delay_rate": 0.20,
            "public_hearing_held": 1,
            "objections_filed_count": 3,
            "stakeholder_meetings_count": 2,
        },
    }

    with TestClient(app) as client:
        response = client.post(
            "/predict",
            json=sample_request,
            headers={"X-Internal-Token": "dev-secret-local-only"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "test-case-uuid-1234"
    assert data["schema_version"] == "v1"
    assert data["prediction"]["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")
    assert data["metadata"]["prediction_quality"] in ("FULL", "PARTIAL", "DEGRADED", "STUB")
    print("\n[SUCCESS] /predict returned valid response:\n", data)


if __name__ == "__main__":
    test_health_endpoint()
    test_model_info_endpoint()
    test_predict_stub_mode()
    print("\nAll ML service tests passed successfully!")
