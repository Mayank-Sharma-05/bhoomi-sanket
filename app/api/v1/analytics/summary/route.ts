import { NextResponse } from "next/server";
import { mockStore } from "@/lib/data/mockStore";

export async function GET() {
  const summary = await mockStore.getDashboardSummaryAsync();

  const enrichedSummary = {
    ...summary,
    projects: summary.total_projects,
    totalProjects: summary.total_projects,
    packages: summary.total_cases,
    totalPackages: summary.total_cases,
    cases: summary.total_cases,
    totalCases: summary.total_cases,
    activeCases: summary.active_cases,
    criticalCases: summary.critical_cases,
    highRiskCases: summary.high_risk_cases,
    mediumRiskCases: summary.medium_risk_cases,
    lowRiskCases: summary.low_risk_cases,
    avgRiskProbability: summary.avg_risk_probability,
    avg_risk: summary.avg_risk_probability,
    risk_index: summary.avg_risk_probability,
    riskIndex: summary.avg_risk_probability,
    unreadAlertsCount: summary.unread_alerts_count,
  };

  console.log("[Dashboard API Response /api/v1/analytics/summary]:", enrichedSummary);

  return NextResponse.json({
    success: true,
    data: enrichedSummary,
  });
}
