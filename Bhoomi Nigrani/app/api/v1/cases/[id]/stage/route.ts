import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { AcquisitionStage } from "@/shared/types/ml-contract";
import { STAGE_STANDARDS } from "@/lib/utils/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const toStage = body.to_stage as AcquisitionStage;
    const transitionDate = body.transition_date || new Date().toISOString().split("T")[0];

    const result = await mockStore.getCaseByIdAsync(params.id);
    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Case not found" } },
        { status: 404 }
      );
    }

    const standard = STAGE_STANDARDS[toStage];
    const defaultDays = standard ? standard.defaultDays : 180;
    const isStatutory = standard ? standard.isStatutory : false;

    const deadlineDate = new Date(
      new Date(transitionDate).getTime() + defaultDays * 86400000
    )
      .toISOString()
      .split("T")[0];

    const updates = {
      current_stage: toStage,
      stage_entry_date: transitionDate,
      statutory_deadline_date: isStatutory ? deadlineDate : null,
      benchmark_deadline_date: !isStatutory ? deadlineDate : null,
    };

    const updated = mockStore.updateCase(params.id, updates);

    mockStore.addAuditLog({
      id: `log-${Date.now()}`,
      user_id: "usr-officer-01",
      user_name: "Authorized Officer",
      action: "STAGE_TRANSITION",
      entity_type: "acquisition_case",
      entity_id: params.id,
      details: `Transitioned case from ${result.caseData.current_stage} to ${toStage} (${standard?.authority || "BENCHMARK"})`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
      meta: {
        stage_standard: standard,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TRANSITION_ERROR",
          message: err instanceof Error ? err.message : "Failed to record stage transition",
        },
      },
      { status: 400 }
    );
  }
}
