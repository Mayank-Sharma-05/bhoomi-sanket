import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callMLService } from "@/lib/ml/mlProxy";

const PredictionBody = z.object({
  case_id: z.string().min(1),
  schema_version: z.literal("v1").default("v1"),
  trigger: z.enum(["CASE_UPDATE", "BATCH_REFRESH", "MANUAL"]).default("MANUAL"),
  requested_at: z.string().datetime().optional(),
  features: z.object({
    project_type: z.string().min(1),
    funding_model: z.string().min(1),
    land_area_ha: z.number().or(z.string()).optional(),
    num_affected_families: z.number().or(z.string()).optional(),
    budget_crore_bucket: z.string().min(1),
    state_code: z.string().min(1),
    district_id: z.number().optional(),
    current_stage: z.string().min(1),
    days_at_current_stage: z.number().optional(),
    stage_deadline_ratio: z.number().optional(),
    milestone_completion_rate: z.number().optional(),
    legal_cases_pending: z.number().optional(),
    court_stay_active: z.number().optional(),
    avg_dispute_age_days: z.number().optional(),
    comp_disbursement_ratio: z.number().optional(),
    comp_disputes_pending: z.number().optional(),
    max_pending_days_comp: z.number().optional(),
    rr_plan_approved: z.number().optional(),
    resettlement_ratio: z.number().optional(),
    clear_title_percent: z.number().optional(),
    forest_land_involved: z.number().optional(),
    tribal_area: z.number().optional(),
    district_historical_delay_rate: z.number().optional(),
    public_hearing_held: z.number().optional(),
    objections_filed_count: z.number().optional(),
    stakeholder_meetings_count: z.number().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = PredictionBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const response = await callMLService<any>("/predict", "POST", parsed.data);
    return NextResponse.json({ success: true, data: response, source: "ml-service" });
  } catch (err: unknown) {
    console.error("Prediction route error:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PREDICTION_FAILED",
          message: err instanceof Error ? err.message : "Prediction request failed",
        },
      },
      { status: 502 }
    );
  }
}
