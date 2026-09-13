import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await mockStore.getCaseByIdAsync(params.id);

  if (!result) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Acquisition case with ID ${params.id} not found.`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...result.caseData,
      project: {
        id: result.project.id,
        project_name: result.project.project_name,
        project_type: result.project.project_type,
        funding_model: result.project.funding_model,
        district_id: result.project.district_id,
        district_name: result.project.district_name,
        state_code: result.project.state_code,
        land_area_ha: result.project.land_area_ha,
        num_affected_families: result.project.num_affected_families,
      },
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const updated = mockStore.updateCase(params.id, updates);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Case not found" },
        },
        { status: 404 }
      );
    }

    mockStore.addAuditLog({
      id: `log-${Date.now()}`,
      user_id: "usr-officer-01",
      user_name: "Authorized Officer",
      action: "UPDATE_CASE_PARAMETERS",
      entity_type: "acquisition_case",
      entity_id: params.id,
      details: `Updated case fields: ${Object.keys(updates).join(", ")}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: err instanceof Error ? err.message : "Failed to update case",
        },
      },
      { status: 400 }
    );
  }
}
