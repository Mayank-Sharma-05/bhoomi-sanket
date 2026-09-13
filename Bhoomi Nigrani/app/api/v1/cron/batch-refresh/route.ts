import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { extractPredictionFeatures } from "@/lib/ml/featureExtractor";
import { callBatchPredict } from "@/lib/ml/mlClient";
import { evaluateAlerts } from "@/lib/ml/alertEvaluator";
import { BatchPredictionRequest } from "@/shared/types/ml-contract";

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "dev-secret-local-only";

export async function POST(request: NextRequest) {
  // 1. Authenticate batch caller
  const authHeader = request.headers.get("Authorization");
  const providedSecret = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (INTERNAL_API_SECRET && INTERNAL_API_SECRET !== "dev-secret-local-only") {
    if (providedSecret !== INTERNAL_API_SECRET) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
        { status: 401 }
      );
    }
  }

  const projects = mockStore.getProjects();
  const allCases = mockStore.getAllCases().filter((c) => c.overall_status === "ACTIVE");

  // Build batch prediction items
  const batchCases = allCases.map((c) => {
    const project = projects.find((p) => p.id === c.project_id)!;
    const features = extractPredictionFeatures({
      ...c,
      project_type: project.project_type,
      funding_model: project.funding_model,
      land_area_ha: project.land_area_ha,
      num_affected_families: project.num_affected_families,
      budget_crore: project.budget_crore,
      state_code: project.state_code,
      district_id: project.district_id,
      district_historical_delay_rate: 0.35,
    });

    return {
      case_id: c.id,
      features,
    };
  });

  const batchRequest: BatchPredictionRequest = {
    schema_version: "v1",
    trigger: "BATCH_REFRESH",
    requested_at: new Date().toISOString(),
    cases: batchCases,
  };

  try {
    const batchResult = await callBatchPredict(batchRequest);

    let updatedCount = 0;
    let newAlertsCount = 0;

    for (const res of batchResult.results) {
      const existing = mockStore.getCaseById(res.case_id);
      if (!existing) continue;

      const prevAssessment = existing.caseData.latest_assessment;

      // Update case assessment
      mockStore.updateCase(res.case_id, {
        latest_assessment: res,
      });
      updatedCount++;

      // Evaluate alerts
      const alerts = evaluateAlerts({
        caseId: res.case_id,
        caseTitle: existing.caseData.case_title,
        currentStage: existing.caseData.current_stage,
        stageDeadlineRatio: 1.0, // Updated in real extractor
        courtStayActive: existing.caseData.court_stay_active,
        previousRiskLevel: prevAssessment?.prediction.risk_level || null,
        newRiskLevel: res.prediction.risk_level,
        newRiskProbability: res.prediction.risk_probability,
        lastUpdatedDate: new Date().toISOString(),
      });

      for (const a of alerts) {
        mockStore.addAlert({
          id: `cron-alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          case_id: res.case_id,
          case_title: existing.caseData.case_title,
          project_name: existing.project.project_name,
          alert_type: a.alert_type,
          severity: a.severity,
          title: a.title,
          message: a.message,
          created_at: new Date().toISOString(),
          acknowledged: false,
        });
        newAlertsCount++;
      }
    }

    mockStore.addAuditLog({
      id: `log-cron-${Date.now()}`,
      user_id: "system-cron",
      user_name: "Vercel Cron (Nightly Batch)",
      action: "BATCH_RISK_REFRESH",
      entity_type: "batch_prediction",
      entity_id: "all_active_cases",
      details: `Refreshed ${updatedCount} active cases. Generated ${newAlertsCount} new alerts.`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        processed_cases: updatedCount,
        alerts_created: newAlertsCount,
        model_version: batchResult.model_version,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BATCH_CRON_ERROR",
          message: err instanceof Error ? err.message : "Batch refresh failed",
        },
      },
      { status: 500 }
    );
  }
}
