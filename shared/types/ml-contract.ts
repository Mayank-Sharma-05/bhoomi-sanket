/**
 * Bhoomi Sanket — ML Integration Contract (Schema Version: v1)
 *
 * Primary contract between Bhoomi Sanket Application and ML Inference Service.
 * Anti-leakage principle: All features must be observable at prediction time T.
 * Sentinel convention: -1 indicates missing, unobserved, or structurally inapplicable value.
 */

export type ProjectType =
  | "highway"
  | "railway"
  | "industrial"
  | "power"
  | "urban"
  | "irrigation"
  | "other";

export type FundingModel = "government" | "PPP" | "private" | "unknown";

export type BudgetCroreBucket = "small" | "medium" | "large" | "very_large" | "unknown";

export type AcquisitionStage =
  | "SIA"
  | "SECTION_11"
  | "SECTION_19"
  | "AWARD"
  | "POSSESSION"
  | "RR"
  | "CLOSED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type PredictionQuality = "FULL" | "PARTIAL" | "DEGRADED" | "STUB";

export type TriggerEvent = "CASE_UPDATE" | "BATCH_REFRESH" | "MANUAL";

export type FactorDirection = "INCREASES_RISK" | "REDUCES_RISK";

export type RecommendationCategory =
  | "COMPENSATION"
  | "LEGAL"
  | "ADMINISTRATIVE"
  | "RR"
  | "DOCUMENTATION"
  | "STAKEHOLDER";

export interface PredictionFeatures {
  // ── PROJECT FEATURES ─────────────────────────────────────────
  project_type: ProjectType;
  funding_model: FundingModel;
  land_area_ha: number; // positive float; null -> -1
  num_affected_families: number; // non-negative int; null -> -1
  budget_crore_bucket: BudgetCroreBucket;
  state_code: string; // ISO 3166-2 sub-code e.g. "UP", "MH"
  district_id: number;

  // ── STAGE FEATURES (Observed at evaluation timestamp T) ──────
  current_stage: AcquisitionStage;
  days_at_current_stage: number; // non-negative int; -1 if unknown
  stage_deadline_ratio: number; // elapsed days / applicable stage days; -1 if open
  milestone_completion_rate: number; // 0.0 to 1.0; -1 if not tracked

  // ── LEGAL FEATURES ───────────────────────────────────────────
  legal_cases_pending: number; // non-negative int
  court_stay_active: 0 | 1; // 0=false, 1=true
  avg_dispute_age_days: number; // non-negative float; -1 if none

  // ── COMPENSATION FEATURES ────────────────────────────────────
  comp_disbursement_ratio: number; // 0.0 to 1.0; -1 if award not yet made
  comp_disputes_pending: number; // non-negative int
  max_pending_days_comp: number; // non-negative int; -1 if none

  // ── REHABILITATION FEATURES ──────────────────────────────────
  rr_plan_approved: 0 | 1;
  resettlement_ratio: number; // 0.0 to 1.0; -1 if R&R not applicable

  // ── LAND RECORD FEATURES ─────────────────────────────────────
  clear_title_percent: number; // 0.0 to 100.0; -1 if unknown
  forest_land_involved: 0 | 1;
  tribal_area: 0 | 1;

  // ── HISTORICAL / CONTEXTUAL FEATURES ─────────────────────────
  district_historical_delay_rate: number; // 0.0 to 1.0; -1 if no historical records

  // ── STAKEHOLDER FEATURES ─────────────────────────────────────
  public_hearing_held: 0 | 1;
  objections_filed_count: number; // non-negative int; -1 if unrecorded
  stakeholder_meetings_count: number; // non-negative int; -1 if unrecorded
}

export interface PredictionRequest {
  case_id: string; // UUID of acquisition_case
  schema_version: "v1";
  trigger: TriggerEvent;
  requested_at: string; // ISO 8601
  features: PredictionFeatures;
}

export interface SHAPFactor {
  feature: keyof PredictionFeatures | string;
  value: number | string;
  shap_value: number; // signed impact
  label: string; // human-readable explanation
  direction: FactorDirection;
}

export interface ActionRecommendation {
  priority: number; // 1 = highest priority
  category: RecommendationCategory;
  action: string;
  detail: string;
  driven_by_feature: string;
}

export interface PredictionResult {
  risk_probability: number; // 0.0000 to 1.0000
  risk_level: RiskLevel;
  confidence: ConfidenceLevel;
}

export interface ExplanationResult {
  base_probability: number;
  top_factors: SHAPFactor[];
}

export interface PredictionMetadata {
  features_used: number;
  features_missing: number;
  missing_feature_names: string[];
  prediction_quality: PredictionQuality;
}

export interface PredictionResponse {
  case_id: string;
  predicted_at: string;
  schema_version: "v1";
  model_version: string;
  prediction: PredictionResult;
  explanation: ExplanationResult;
  recommendations: ActionRecommendation[];
  metadata: PredictionMetadata;
}

export interface BatchPredictionCaseItem {
  case_id: string;
  features: PredictionFeatures;
}

export interface BatchPredictionRequest {
  schema_version: "v1";
  trigger: TriggerEvent;
  requested_at: string;
  cases: BatchPredictionCaseItem[];
}

export interface BatchPredictionResponse {
  predicted_at: string;
  model_version: string;
  schema_version: "v1";
  results: PredictionResponse[];
  errors: Array<{
    case_id: string;
    error: string;
  }>;
}

export interface ModelHealthResponse {
  status: "ok" | "degraded" | "stub";
  model_version: string;
  uptime_seconds: number;
  is_stub: boolean;
}

export interface ModelInfoResponse {
  model_version: string;
  schema_version: "v1";
  training_date: string;
  feature_count: number;
  risk_thresholds: {
    low_max: number;
    medium_max: number;
    high_max: number;
  };
  base_probability: number;
  is_stub: boolean;
}
