/**
 * Bhoomi Sanket — Alert Evaluator
 * Idempotent alert trigger evaluator with duplicate suppression.
 */

import { RiskLevel, AcquisitionStage } from "@/shared/types/ml-contract";

export interface AlertEvaluationContext {
  caseId: string;
  caseTitle: string;
  currentStage: AcquisitionStage;
  stageDeadlineRatio: number;
  courtStayActive: boolean;
  previousCourtStayActive?: boolean;
  previousRiskLevel?: RiskLevel | null;
  newRiskLevel: RiskLevel;
  newRiskProbability: number;
  lastUpdatedDate: string;
  existingActiveAlerts?: Array<{
    alert_type: string;
    severity: string;
    created_at: string;
  }>;
}

export interface GeneratedAlert {
  alert_type: "RISK_ESCALATION" | "DEADLINE_BREACH" | "COURT_STAY" | "STALENESS";
  severity: RiskLevel;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

const RISK_TIER_RANK: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function evaluateAlerts(context: AlertEvaluationContext): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];
  const existingAlerts = context.existingActiveAlerts || [];

  // Helper: check if alert of same type was created within last 24 hours
  const isDuplicate = (type: string) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return existingAlerts.some(
      (a) => a.alert_type === type && new Date(a.created_at).getTime() > oneDayAgo
    );
  };

  // 1. RISK_ESCALATION: Tier moved up
  if (context.previousRiskLevel) {
    const prevRank = RISK_TIER_RANK[context.previousRiskLevel];
    const newRank = RISK_TIER_RANK[context.newRiskLevel];
    if (newRank > prevRank && !isDuplicate("RISK_ESCALATION")) {
      alerts.push({
        alert_type: "RISK_ESCALATION",
        severity: context.newRiskLevel,
        title: `Risk Tier Escalated to ${context.newRiskLevel}`,
        message: `${context.caseTitle} increased from ${context.previousRiskLevel} to ${context.newRiskLevel} (${Math.round(context.newRiskProbability * 100)}% delay probability).`,
        metadata: {
          from_tier: context.previousRiskLevel,
          to_tier: context.newRiskLevel,
          probability: context.newRiskProbability,
        },
      });
    }
  }

  // 2. DEADLINE_BREACH: Pacing ratio > 1.0
  if (context.stageDeadlineRatio > 1.0 && !isDuplicate("DEADLINE_BREACH")) {
    const breachPercent = Math.round((context.stageDeadlineRatio - 1.0) * 100);
    const severity: RiskLevel = context.stageDeadlineRatio > 1.5 ? "CRITICAL" : "HIGH";
    alerts.push({
      alert_type: "DEADLINE_BREACH",
      severity,
      title: `Stage Deadline Exceeded by ${breachPercent}%`,
      message: `${context.caseTitle} has surpassed its standard duration in ${context.currentStage} by ${breachPercent}%. Proactive intervention recommended.`,
      metadata: {
        stage: context.currentStage,
        ratio: context.stageDeadlineRatio,
      },
    });
  }

  // 3. COURT_STAY: Litigation halt
  if (context.courtStayActive && !context.previousCourtStayActive && !isDuplicate("COURT_STAY")) {
    alerts.push({
      alert_type: "COURT_STAY",
      severity: "HIGH",
      title: "Court Stay Order Active",
      message: `Active judicial stay restraining physical possession reported for ${context.caseTitle}.`,
      metadata: {
        stage: context.currentStage,
      },
    });
  }

  return alerts;
}
