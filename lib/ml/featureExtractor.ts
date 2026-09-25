/**
 * Bhoomi Sanket — Feature Extractor
 * Transforms database acquisition case records into strictly typed PredictionFeatures (v1).
 * Anti-leakage principle: Features must strictly be observable as of evaluation timestamp T.
 */

import {
  PredictionFeatures,
  ProjectType,
  FundingModel,
  AcquisitionStage,
  BudgetCroreBucket,
} from "@/shared/types/ml-contract";
import { STAGE_STANDARDS } from "@/lib/utils/constants";

export interface RawCaseRecord {
  // Case fields
  id: string;
  project_id: string;
  current_stage: AcquisitionStage;
  stage_entry_date: string;
  statutory_deadline_date?: string | null;
  benchmark_deadline_date?: string | null;
  sia_started?: boolean | null;
  public_hearing_held?: boolean | null;
  objections_filed_count?: number | null;
  legal_cases_pending?: number | null;
  court_stay_active?: boolean | null;
  avg_dispute_age_days?: number | null;
  comp_awarded_crore?: number | null;
  comp_disbursed_crore?: number | null;
  comp_disputes_pending?: number | null;
  max_pending_days_comp?: number | null;
  rr_plan_approved?: boolean | null;
  families_resettled?: number | null;
  clear_title_percent?: number | null;
  forest_land_involved?: boolean | null;
  tribal_area?: boolean | null;
  stakeholder_meetings_count?: number | null;
  possession_taken?: boolean | null;

  // Joined project fields
  project_type?: ProjectType | string;
  funding_model?: FundingModel | string;
  land_area_ha?: number | null;
  num_affected_families?: number | null;
  budget_crore?: number | null;
  state_code?: string | null;
  district_id?: number | null;

  // District contextual statistics (derived from history)
  district_historical_delay_rate?: number | null;
}

export function extractPredictionFeatures(
  record: RawCaseRecord,
  evaluationTimestamp: Date = new Date()
): PredictionFeatures {
  // 1. Pacing & stage duration ratio
  const stageEntry = new Date(record.stage_entry_date);
  const diffTime = Math.max(0, evaluationTimestamp.getTime() - stageEntry.getTime());
  const daysAtCurrentStage = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const standard = STAGE_STANDARDS[record.current_stage];
  const standardDays = standard ? standard.defaultDays : 180;
  const stageDeadlineRatio =
    standardDays > 0 ? Number((daysAtCurrentStage / standardDays).toFixed(3)) : -1;

  // 2. Budget bucket categorization
  const budget = record.budget_crore;
  let budgetBucket: BudgetCroreBucket = "unknown";
  if (budget !== null && budget !== undefined && budget >= 0) {
    if (budget < 50) budgetBucket = "small";
    else if (budget <= 500) budgetBucket = "medium";
    else if (budget <= 2000) budgetBucket = "large";
    else budgetBucket = "very_large";
  }

  // 3. Compensation disbursement ratio
  let compRatio = -1;
  if (
    record.comp_awarded_crore !== null &&
    record.comp_awarded_crore !== undefined &&
    record.comp_awarded_crore > 0
  ) {
    const disbursed = record.comp_disbursed_crore || 0;
    compRatio = Number(Math.min(1.0, disbursed / record.comp_awarded_crore).toFixed(3));
  }

  // 4. Resettlement progress ratio
  let resettlementRatio = -1;
  if (
    record.num_affected_families !== null &&
    record.num_affected_families !== undefined &&
    record.num_affected_families > 0
  ) {
    const resettled = record.families_resettled || 0;
    resettlementRatio = Number(
      Math.min(1.0, resettled / record.num_affected_families).toFixed(3)
    );
  }

  return {
    project_type: (record.project_type as ProjectType) || "highway",
    funding_model: (record.funding_model as FundingModel) || "government",
    land_area_ha: record.land_area_ha !== null && record.land_area_ha !== undefined ? Number(record.land_area_ha) : -1,
    num_affected_families:
      record.num_affected_families !== null && record.num_affected_families !== undefined
        ? Number(record.num_affected_families)
        : -1,
    budget_crore_bucket: budgetBucket,
    state_code: record.state_code || "UP",
    district_id: record.district_id ? Number(record.district_id) : 101,

    current_stage: record.current_stage,
    days_at_current_stage: daysAtCurrentStage,
    stage_deadline_ratio: stageDeadlineRatio,
    milestone_completion_rate: -1, // Future milestone granular tracking

    legal_cases_pending: record.legal_cases_pending ? Number(record.legal_cases_pending) : 0,
    court_stay_active: record.court_stay_active ? 1 : 0,
    avg_dispute_age_days:
      record.avg_dispute_age_days !== null && record.avg_dispute_age_days !== undefined
        ? Number(record.avg_dispute_age_days)
        : -1,

    comp_disbursement_ratio: compRatio,
    comp_disputes_pending: record.comp_disputes_pending
      ? Number(record.comp_disputes_pending)
      : 0,
    max_pending_days_comp: record.max_pending_days_comp
      ? Number(record.max_pending_days_comp)
      : 0,

    rr_plan_approved: record.rr_plan_approved ? 1 : 0,
    resettlement_ratio: resettlementRatio,

    clear_title_percent:
      record.clear_title_percent !== null && record.clear_title_percent !== undefined
        ? Number(record.clear_title_percent)
        : -1,
    forest_land_involved: record.forest_land_involved ? 1 : 0,
    tribal_area: record.tribal_area ? 1 : 0,

    district_historical_delay_rate:
      record.district_historical_delay_rate !== null &&
      record.district_historical_delay_rate !== undefined
        ? Number(record.district_historical_delay_rate)
        : -1,

    public_hearing_held: record.public_hearing_held ? 1 : 0,
    objections_filed_count:
      record.objections_filed_count !== null && record.objections_filed_count !== undefined
        ? Number(record.objections_filed_count)
        : -1,
    stakeholder_meetings_count:
      record.stakeholder_meetings_count !== null && record.stakeholder_meetings_count !== undefined
        ? Number(record.stakeholder_meetings_count)
        : -1,
  };
}
