"use client";

import React, { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function WhatIfSimulatorPage() {
  const { t } = useT();
  const [model, setModel] = useState({
    compensation_completion_ratio: 0.65,
    compensation_paid_amount: 120,
    stage_elapsed_days: 14,
    stage_deadline_ratio: 0.7,
    compensation_pending_amount: 60,
  });
  const [result, setResult] = useState<any>(null);

  async function runSimulation() {
    const res = await fetch("/api/what-if", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_id: "case-demo-001",
        schema_version: "v1",
        trigger: "MANUAL",
        requested_at: new Date().toISOString(),
        features: {
          project_type: "highway",
          funding_model: "government",
          land_area_ha: 250,
          num_affected_families: 100,
          budget_crore_bucket: "medium",
          state_code: "UP",
          district_id: 101,
          current_stage: "SECTION_11",
          days_at_current_stage: 45,
          stage_deadline_ratio: 0.25,
          milestone_completion_rate: 0.5,
          legal_cases_pending: 0,
          court_stay_active: 0,
          avg_dispute_age_days: 10,
          comp_disbursement_ratio: 0.4,
          comp_disputes_pending: 1,
          max_pending_days_comp: 10,
          rr_plan_approved: 1,
          resettlement_ratio: 0.8,
          clear_title_percent: 90,
          forest_land_involved: 0,
          tribal_area: 0,
          district_historical_delay_rate: 0.1,
          public_hearing_held: 1,
          objections_filed_count: 0,
          stakeholder_meetings_count: 2,
        },
        scenario: model,
      }),
    });
    const json = await res.json();
    setResult(json.data || json);
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="font-bold text-xl text-slate-900 dark:text-slate-100">{t("whatIf.title")}</div>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(model).map(([k, v]) => (
          <label className="flex flex-col gap-1" key={k}>
            <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{k}</span>
            <input className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500" type="number" value={v} onChange={(e) => setModel({ ...model, [k]: Number(e.target.value) })} />
          </label>
        ))}
      </div>
      <button onClick={runSimulation} className="px-4 py-2 rounded bg-slate-950 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer">{t("whatIf.run")}</button>
      {result && (
        <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
          <div>{t("whatIf.oldRisk")}: <span className="font-bold font-mono">{result.old_risk}</span></div>
          <div>{t("whatIf.newRisk")}: <span className="font-bold font-mono">{result.new_risk}</span></div>
          <div>{t("whatIf.riskReduction")}: <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{result.risk_reduction}</span></div>
          <div className="mt-2">
            <span className="font-bold">{t("whatIf.updatedRecs")}:</span>
            <ul className="list-disc pl-5 mt-1">
              {(result.updated_recommendations || []).map((r: any, i: number) => <li key={i}>{typeof r === "string" ? r : r.action || JSON.stringify(r)}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
