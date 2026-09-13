import { NextRequest, NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";
import { ProjectType, FundingModel } from "@/shared/types/ml-contract";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("district_id");
  const stateCode = searchParams.get("state_code");
  const query = searchParams.get("q") || undefined;

  const [summaryList, availableStates] = await Promise.all([
    mockStore.getProjectSummariesAsync({
      districtId: districtId ? Number(districtId) : undefined,
      stateCode: stateCode || undefined,
      query,
    }),
    mockStore.getDistinctStatesAsync(),
  ]);

  return NextResponse.json({
    success: true,
    data: summaryList,
    meta: {
      total: summaryList.length,
      available_states: availableStates,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newProjectId = `proj-${Date.now()}`;
    const newCaseId = `case-${Date.now()}`;

    const newProject = {
      id: newProjectId,
      project_name: body.project_name || "New Infrastructure Project",
      project_type: (body.project_type as ProjectType) || "highway",
      funding_model: (body.funding_model as FundingModel) || "government",
      implementing_agency: body.implementing_agency || "State PWD",
      district_id: Number(body.district_id) || 1,
      district_name: body.district_name || "Central District",
      state_code: body.state_code || "DL",
      state_name: body.state_name || "Delhi",
      land_area_ha: Number(body.land_area_ha) || 100,
      num_affected_families: Number(body.num_affected_families) || 200,
      budget_crore: Number(body.budget_crore) || 500,
      project_start_date: body.project_start_date || new Date().toISOString().split("T")[0],
      description: body.description || "",
      is_demo_data: false,
      cases: [
        {
          id: newCaseId,
          project_id: newProjectId,
          case_number: "PHASE-01",
          case_title: "Initial Acquisition Phase",
          current_stage: "SIA" as const,
          stage_entry_date: new Date().toISOString().split("T")[0],
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
        },
      ],
    };

    mockStore.addProject(newProject);

    mockStore.addAuditLog({
      id: `log-${Date.now()}`,
      user_id: "usr-officer-01",
      user_name: "Authorized Officer",
      action: "CREATE_PROJECT",
      entity_type: "project",
      entity_id: newProjectId,
      details: `Created project ${newProject.project_name} with initial case PHASE-01`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: newProject,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: err instanceof Error ? err.message : "Failed to create project",
        },
      },
      { status: 400 }
    );
  }
}
