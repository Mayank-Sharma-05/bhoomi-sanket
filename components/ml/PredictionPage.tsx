"use client";

import React, { useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function PredictionPage() {
  const { t } = useT();
  const [payload, setPayload] = useState({
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
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onPredict() {
    setLoading(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="font-bold text-xl text-slate-900 dark:text-slate-100">{t("predict.title")}</div>
      <button onClick={onPredict} className="px-4 py-2 rounded bg-slate-950 dark:bg-blue-600 dark:hover:bg-blue-500 text-white disabled:opacity-50 cursor-pointer font-semibold text-xs" disabled={loading}>
        {loading ? t("predict.predicting") : t("predict.predict")}
      </button>

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold">{t("predict.riskScore")}</div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{Math.round(result.prediction?.risk_probability * 100)}%</div>
            </div>
            <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold">{t("predict.priority")}</div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{result.prediction?.risk_level}</div>
            </div>
          </div>
          <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3">
            <div className="font-bold text-slate-900 dark:text-slate-100">{t("predict.executiveSummary")}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{result.explanation?.base_probability || t("predict.summaryReady")}</div>
          </div>
          <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3">
            <div className="font-bold text-slate-900 dark:text-slate-100">{t("predict.recommendations")}</div>
            <ul className="list-disc pl-5 mt-1 text-sm text-slate-700 dark:text-slate-300">
              {(result.recommendations || []).map((r: any, i: number) => <li key={i}>{r.action}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
