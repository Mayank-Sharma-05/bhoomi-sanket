import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { AcquisitionStage } from "@/shared/types/ml-contract";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const projectId = decodeURIComponent(resolvedParams?.id || "").trim();
  const project = await mockStore.getProjectByIdAsync(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: project.cases,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const projectId = decodeURIComponent(resolvedParams?.id || "").trim();
  const project = await mockStore.getProjectByIdAsync(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const newCaseId = `case-${Date.now()}`;
    const caseNumber = body.case_number || `PKG-0${project.cases.length + 1}`;

    const newCase = {
      id: newCaseId,
      project_id: project.id,
      case_number: caseNumber,
      case_title: body.case_title || "Additional Acquisition Phase",
      current_stage: (body.current_stage as AcquisitionStage) || "SIA",
      stage_entry_date: body.stage_entry_date || new Date().toISOString().split("T")[0],
      statutory_deadline_date: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
      benchmark_deadline_date: null,
      sia_started: true,
      public_hearing_held: false,
      objections_filed_count: 0,
      legal_cases_pending: 0,
      court_stay_active: false,
      avg_dispute_age_days: 0,
      comp_awarded_crore: null,
      comp_disbursed_crore: 0,
      comp_disputes_pending: 0,
      max_pending_days_comp: 0,
      rr_plan_approved: false,
      families_resettled: 0,
      clear_title_percent: 100,
      forest_land_involved: false,
      tribal_area: false,
      stakeholder_meetings_count: 0,
      overall_status: "ACTIVE" as const,
    };

    mockStore.addCaseToProject(project.id, newCase);

    mockStore.addAuditLog({
      id: `log-${Date.now()}`,
      user_id: "usr-officer-01",
      user_name: "Authorized Officer",
      action: "ADD_CASE_TO_PROJECT",
      entity_type: "acquisition_case",
      entity_id: newCaseId,
      details: `Added case ${caseNumber} (${newCase.case_title}) to project ${project.project_name}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newCase,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: err instanceof Error ? err.message : "Failed to add case to project",
        },
      },
      { status: 400 }
    );
  }
}
