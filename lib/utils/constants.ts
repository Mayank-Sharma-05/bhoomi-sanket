/**
 * Bhoomi Sanket — Domain Constants & Stage Standards
 * Distinguishes statutory legal standards from configurable operational benchmarks.
 */

import { AcquisitionStage, ProjectType } from "@/shared/types/ml-contract";

export interface StageStandard {
  stage: AcquisitionStage;
  defaultDays: number;
  isStatutory: boolean;
  authority: "STATUTORY_MANDATE" | "OPERATIONAL_BENCHMARK";
  reference: string;
  label: string;
}

export const STAGE_STANDARDS: Record<AcquisitionStage, StageStandard> = {
  SIA: {
    stage: "SIA",
    defaultDays: 180,
    isStatutory: true,
    authority: "STATUTORY_MANDATE",
    reference: "RFCTLARR Act 2013, Section 4(2)",
    label: "Social Impact Assessment (SIA)",
  },
  SECTION_11: {
    stage: "SECTION_11",
    defaultDays: 365,
    isStatutory: true,
    authority: "STATUTORY_MANDATE",
    reference: "RFCTLARR Act 2013, Section 19(1)",
    label: "Preliminary Notification (Sec 11)",
  },
  SECTION_19: {
    stage: "SECTION_19",
    defaultDays: 365,
    isStatutory: true,
    authority: "STATUTORY_MANDATE",
    reference: "RFCTLARR Act 2013, Section 25",
    label: "Declaration of Acquisition (Sec 19)",
  },
  AWARD: {
    stage: "AWARD",
    defaultDays: 90,
    isStatutory: false,
    authority: "OPERATIONAL_BENCHMARK",
    reference: "Operational Benchmark (Configurable)",
    label: "Award & Compensation Deposit",
  },
  POSSESSION: {
    stage: "POSSESSION",
    defaultDays: 180,
    isStatutory: false,
    authority: "OPERATIONAL_BENCHMARK",
    reference: "Operational Benchmark (Configurable)",
    label: "Physical Possession Takeover",
  },
  RR: {
    stage: "RR",
    defaultDays: 365,
    isStatutory: false,
    authority: "OPERATIONAL_BENCHMARK",
    reference: "Operational Benchmark (Configurable)",
    label: "Rehabilitation & Resettlement",
  },
  CLOSED: {
    stage: "CLOSED",
    defaultDays: 0,
    isStatutory: false,
    authority: "OPERATIONAL_BENCHMARK",
    reference: "Terminal State",
    label: "Acquisition Completed",
  },
};

export const RISK_THRESHOLDS = {
  LOW_MAX: 0.30,
  MEDIUM_MAX: 0.55,
  HIGH_MAX: 0.80,
};

export const ORDERED_STAGES: AcquisitionStage[] = [
  "SIA",
  "SECTION_11",
  "SECTION_19",
  "AWARD",
  "POSSESSION",
  "RR",
  "CLOSED",
];

export const DEMO_BANNER_TEXT =
  "Bhoomi Sanket | DEMO MODE | Synthetic data only | Not real government data";
