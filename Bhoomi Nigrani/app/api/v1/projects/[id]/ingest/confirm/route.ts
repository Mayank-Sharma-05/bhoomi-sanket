import { NextRequest, NextResponse } from "next/server";
import { mockStore, DemoCase } from "@/lib/data/mockStore";
import { STAGE_STANDARDS } from "@/lib/utils/constants";
import { AcquisitionStage, PredictionRequest } from "@/shared/types/ml-contract";
import { extractPredictionFeatures } from "@/lib/ml/featureExtractor";
import { callPredict } from "@/lib/ml/mlClient";

const VALID_STAGES: AcquisitionStage[] = [
  "SIA",
  "SECTION_11",
  "SECTION_19",
  "AWARD",
  "POSSESSION",
  "RR",
  "CLOSED",
];

function sanitizeCell(val: any): any {
  if (typeof val === "string") {
    // Prevent CSV formula injection
    if (/^[=+@-]/.test(val)) {
      val = "'" + val;
    }
    return val.trim();
  }
  return val;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const projectId = decodeURIComponent(resolvedParams?.id || "").trim();

    const project = await mockStore.getProjectByIdAsync(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      filename,
      file_type,
      file_size_bytes = 0,
      records = [],
    } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "EMPTY_DATA", message: "No records provided for import." } },
        { status: 400 }
      );
    }

    const validationErrors: Array<{ row: number; field: string; error: string }> = [];
    const validCases: DemoCase[] = [];
    const seenCaseNumbers = new Set<string>();

    // Validation Loop
    records.forEach((row: Record<string, any>, idx: number) => {
      const rowNum = idx + 1;
      const rawCaseNum = sanitizeCell(row.case_number || `PKG-${rowNum}`);
      const caseNumber = String(rawCaseNum).trim();

      // Deduplication: skip duplicate case identifiers within same payload
      if (seenCaseNumbers.has(caseNumber)) {
        return;
      }
      seenCaseNumbers.add(caseNumber);

      let stage = (sanitizeCell(row.current_stage) || "SIA").toUpperCase();
      let stageEntryDate = sanitizeCell(row.stage_entry_date) || new Date().toISOString().split("T")[0];

      // Normalize common stage variations from Gazette & official datasets
      if (stage.includes("11") || stage.includes("15")) stage = "SECTION_11";
      else if (stage.includes("19") || stage.includes("DECLARATION")) stage = "SECTION_19";
      else if (stage.includes("23") || stage.includes("AWARD") || stage.includes("ENQUIRY")) stage = "AWARD";
      else if (stage.includes("38") || stage.includes("POSSESS")) stage = "POSSESSION";
      else if (stage.includes("31") || stage.includes("R&R") || stage.includes("RR") || stage.includes("RESETTLE")) stage = "RR";
      else if (stage.includes("CLOSE")) stage = "CLOSED";
      else if (stage.includes("SIA") || stage.includes("SECTION 4") || stage.includes("SOCIAL")) stage = "SIA";

      if (!VALID_STAGES.includes(stage as AcquisitionStage)) {
        validationErrors.push({
          row: rowNum,
          field: "current_stage",
          error: `Invalid acquisition stage "${row.current_stage}". Must match RFCTLARR Act stages.`,
        });
      }

      // Validate date
      if (isNaN(Date.parse(stageEntryDate))) {
        validationErrors.push({
          row: rowNum,
          field: "stage_entry_date",
          error: `Invalid date format "${stageEntryDate}". Expected YYYY-MM-DD or DD/MM/YYYY.`,
        });
      }

      const numAffectedFamilies = Math.max(0, parseInt(row.num_affected_families, 10) || 0);
      const landAreaHa = Math.max(0, parseFloat(row.land_area_ha) || 0);
      const clearTitlePercent = Math.min(100, Math.max(0, parseFloat(row.clear_title_percent) || 100));

      const courtStayActive =
        row.court_stay_active === true ||
        row.court_stay_active === "true" ||
        row.court_stay_active === "yes" ||
        row.court_stay_active === 1 ||
        row.court_stay_active === "1";

      const legalCasesPending = Math.max(0, parseInt(row.legal_cases_pending, 10) || 0);

      // Support both direct ₹ Crore input and raw Rupee amounts (> 10,000 -> divide by 10^7)
      let compAwardedCrore = row.comp_awarded_crore ? Math.max(0, parseFloat(row.comp_awarded_crore)) : null;
      let compDisbursedCrore = Math.max(0, parseFloat(row.comp_disbursed_crore) || 0);

      if (compAwardedCrore !== null && compAwardedCrore > 10000) {
        compAwardedCrore = Number((compAwardedCrore / 10000000).toFixed(2));
      }
      if (compDisbursedCrore > 10000) {
        compDisbursedCrore = Number((compDisbursedCrore / 10000000).toFixed(2));
      }

      if (compAwardedCrore !== null && compAwardedCrore > 0 && compDisbursedCrore > compAwardedCrore) {
        validationErrors.push({
          row: rowNum,
          field: "comp_disbursed_crore",
          error: `Disbursed amount (₹${compDisbursedCrore} Cr) cannot exceed awarded amount (₹${compAwardedCrore} Cr).`,
        });
      }

      // Compute Deadlines based on RFCTLARR standard
      const standard = STAGE_STANDARDS[stage as AcquisitionStage];
      const entryTimestamp = Date.parse(stageEntryDate) || Date.now();
      const deadlineDate = standard?.defaultDays
        ? new Date(entryTimestamp + standard.defaultDays * 86400000).toISOString().split("T")[0]
        : null;

      const isStatutory = standard?.authority === "STATUTORY_MANDATE";

      validCases.push({
        id: `case-${Date.now()}-${idx}`,
        project_id: project.id,
        case_number: String(caseNumber),
        case_title: sanitizeCell(row.case_title) || `Acquisition Package ${caseNumber}`,
        current_stage: stage as AcquisitionStage,
        stage_entry_date: stageEntryDate,
        statutory_deadline_date: isStatutory ? deadlineDate : null,
        benchmark_deadline_date: !isStatutory ? deadlineDate : null,
        sia_started: stage === "SIA" || row.sia_started === true,
        public_hearing_held: row.public_hearing_held === true,
        objections_filed_count: parseInt(row.objections_filed_count, 10) || 0,
        legal_cases_pending: legalCasesPending,
        court_stay_active: courtStayActive,
        avg_dispute_age_days: parseInt(row.avg_dispute_age_days, 10) || 0,
        comp_awarded_crore: compAwardedCrore,
        comp_disbursed_crore: compDisbursedCrore,
        comp_disputes_pending: parseInt(row.comp_disputes_pending, 10) || 0,
        max_pending_days_comp: parseInt(row.max_pending_days_comp, 10) || 0,
        rr_plan_approved: row.rr_plan_approved === true || row.rr_required === 1 || row.rr_required === "1",
        families_resettled: parseInt(row.families_resettled, 10) || 0,
        clear_title_percent: clearTitlePercent,
        forest_land_involved: row.forest_land_involved === true,
        tribal_area: row.tribal_area === true,
        stakeholder_meetings_count: parseInt(row.stakeholder_meetings_count, 10) || 0,
        overall_status: "ACTIVE",
      });
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: `Validation failed on ${validationErrors.length} field(s). Please review and correct before import.`,
            errors: validationErrors.slice(0, 50),
          },
        },
        { status: 400 }
      );
    }

    // 1. Commit cases into Database and Store (avoiding duplicates)
    const committedCases = await mockStore.addCasesToProject(project.id, validCases);

    // 2. Track Provenance in data_imports
    const importRecord = mockStore.addDataImport({
      id: `import-${Date.now()}`,
      project_id: project.id,
      source_filename: sanitizeCell(filename || "acquisition_data.csv"),
      source_type: (file_type?.toUpperCase() || "CSV") as any,
      file_size_bytes: Number(file_size_bytes) || 0,
      uploaded_by: "usr-officer-01",
      uploader_name: "Authorized Officer",
      records_count: committedCases.length,
      validation_status: "CONFIRMED",
      validation_summary: {
        total_rows: records.length,
        valid_rows: committedCases.length,
        warning_rows: 0,
        error_rows: 0,
      },
      created_at: new Date().toISOString(),
    });

    // 3. Run a prediction pass for each committed record and attach assessment to the case model
    const assessmentMeta: Array<{ case_id: string; isFallback: boolean; risk_level: string; risk_probability: number }> = [];
    const assessmentErrors: Array<{ case_id: string; message: string }> = [];
    for (const committedCase of committedCases) {
      try {
        const predictionFeatures = extractPredictionFeatures({
          ...committedCase,
          project_type: project.project_type,
          funding_model: project.funding_model,
          land_area_ha: project.land_area_ha,
          num_affected_families: project.num_affected_families,
          budget_crore: project.budget_crore,
          state_code: project.state_code,
          district_id: project.district_id,
          district_historical_delay_rate: 0.35,
        });

        const predictionRequest: PredictionRequest = {
          case_id: committedCase.id,
          schema_version: "v1",
          trigger: "CASE_UPDATE",
          requested_at: new Date().toISOString(),
          features: predictionFeatures,
        };

        const { response: predResponse, isFallback } = await callPredict(predictionRequest);
        mockStore.updateCase(committedCase.id, {
          latest_assessment: predResponse,
        });

        assessmentMeta.push({
          case_id: committedCase.id,
          isFallback,
          risk_level: predResponse.prediction.risk_level,
          risk_probability: predResponse.prediction.risk_probability,
        });
      } catch (assessmentErr) {
        const message = assessmentErr instanceof Error ? assessmentErr.message : "ML inference request failed";
        console.error(`Prediction attachment failed for case ${committedCase.id}:`, message);
        assessmentErrors.push({ case_id: committedCase.id, message });
      }
    }

    // 4. Audit Log for Import
    mockStore.addAuditLog({
      id: `log-${Date.now()}`,
      user_id: "usr-officer-01",
      user_name: "Authorized Officer",
      action: "IMPORT_ACQUISITION_DATA",
      entity_type: "project",
      entity_id: project.id,
      details: `Imported ${committedCases.length} acquisition case package(s) from ${importRecord.source_filename}. Predictions attached: ${assessmentMeta.length}/${committedCases.length}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        import_id: importRecord.id,
        project_id: project.id,
        records_imported: committedCases.length,
        cases_count: project.cases.length,
        assessments_attached: assessmentMeta.length,
        assessment_errors: assessmentErrors,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error confirming data import";
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
