import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { extractPredictionFeatures } from "@/lib/ml/featureExtractor";
import { callPredict } from "@/lib/ml/mlClient";
import { evaluateAlerts } from "@/lib/ml/alertEvaluator";
import { PredictionRequest } from "@/shared/types/ml-contract";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await mockStore.getCaseByIdAsync(params.id);
  if (!result) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Case not found" } },
      { status: 404 }
    );
  }

  const { caseData, project } = result;
  const previousAssessment = caseData.latest_assessment;

  // 1. Extract features strictly observable at prediction time T
  const features = extractPredictionFeatures({
    ...caseData,
    project_type: project.project_type,
    funding_model: project.funding_model,
    land_area_ha: project.land_area_ha,
    num_affected_families: project.num_affected_families,
    budget_crore: project.budget_crore,
    state_code: project.state_code,
    district_id: project.district_id,
    district_historical_delay_rate: 0.35, // Demo district rate
  });

  const predRequest: PredictionRequest = {
    case_id: caseData.id,
    schema_version: "v1",
    trigger: "MANUAL",
    requested_at: new Date().toISOString(),
    features,
  };

  // 2. Call the live inference service.  Do not manufacture an assessment when
  // inference fails: the UI must receive a diagnosable error rather than remain
  // silently pending.
  let predResponse;
  let isFallback;
  try {
    ({ response: predResponse, isFallback } = await callPredict(predRequest));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ML inference request failed";
    console.error(`Risk assessment failed for case ${caseData.id}:`, message);
    return NextResponse.json(
      { success: false, error: { code: "ML_INFERENCE_UNAVAILABLE", message } },
      { status: 502 }
    );
  }

  // 3. Save assessment to store
  mockStore.updateCase(caseData.id, {
    latest_assessment: predResponse,
  });

  // 4. Evaluate alerts
  const newAlerts = evaluateAlerts({
    caseId: caseData.id,
    caseTitle: caseData.case_title,
    currentStage: caseData.current_stage,
    stageDeadlineRatio: features.stage_deadline_ratio,
    courtStayActive: Boolean(caseData.court_stay_active),
    previousRiskLevel: previousAssessment?.prediction.risk_level || null,
    newRiskLevel: predResponse.prediction.risk_level,
    newRiskProbability: predResponse.prediction.risk_probability,
    lastUpdatedDate: new Date().toISOString(),
  });

  for (const a of newAlerts) {
    mockStore.addAlert({
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      case_id: caseData.id,
      case_title: caseData.case_title,
      project_name: project.project_name,
      alert_type: a.alert_type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      created_at: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // 5. Audit Log
  mockStore.addAuditLog({
    id: `log-${Date.now()}`,
    user_id: "usr-officer-01",
    user_name: "Authorized Officer",
    action: "RISK_ASSESSED",
    entity_type: "risk_assessment",
    entity_id: caseData.id,
    details: `Assessed risk: ${predResponse.prediction.risk_level} (${Math.round(predResponse.prediction.risk_probability * 100)}%). Fallback: ${isFallback}`,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    data: predResponse,
    meta: {
      is_fallback: isFallback,
      alerts_generated: newAlerts.length,
    },
  });
}
