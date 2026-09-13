"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { SHAPFactorsList } from "@/components/risk/SHAPFactorsList";
import { RecommendationsList } from "@/components/risk/RecommendationsList";
import { StageTimeline } from "@/components/project/StageTimeline";
import {
  ArrowLeft,
  RefreshCw,
  Scale,
  Banknote,
  Users,
} from "lucide-react";
import { formatCurrencyCrores, formatPercentage } from "@/lib/utils/formatters";

export default function CaseWorkspacePage({
  params,
}: {
  params: { id: string; caseId: string };
}) {
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"COMPENSATION" | "LEGAL" | "STAKEHOLDER">("COMPENSATION");

  const fetchCase = () => {
    fetch(`/api/v1/cases/${params.caseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCaseData(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCase();
  }, [params.caseId]);

  const handleTriggerAssessment = async () => {
    setAssessing(true);
    setAssessmentError(null);
    try {
      const res = await fetch(`/api/v1/cases/${params.caseId}/risk/trigger`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local view
        fetchCase();
      } else {
        setAssessmentError(data.error?.message || "ML inference could not be completed.");
      }
    } catch (e) {
      console.error("Assessment error:", e);
      setAssessmentError("ML inference could not be reached. Verify the ML service and try again.");
    } finally {
      setAssessing(false);
    }
  };

  if (loading) {
    return <div className="h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />;
  }

  if (!caseData) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center transition-colors">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Acquisition case not found.</p>
        <Link href={`/projects/${params.id}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          Return to Project
        </Link>
      </div>
    );
  }

  const assessment = caseData.latest_assessment;
  const prediction = assessment?.prediction;
  const explanation = assessment?.explanation;
  const recommendations = assessment?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Back button & top title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/projects/${params.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Overview</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {caseData.case_number}
            </span>
            <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
              {caseData.case_title}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Project: {caseData.project?.project_name} ({caseData.project?.district_name},{" "}
            {caseData.project?.state_code})
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleTriggerAssessment}
          disabled={assessing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 dark:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${assessing ? "animate-spin" : ""}`} />
          <span>{assessing ? "Evaluating ML Model..." : "Run ML Risk Assessment"}</span>
        </button>
      </div>

      {assessmentError && (
        <div role="alert" className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-red-800 dark:text-red-300">
          ML assessment failed: {assessmentError}
        </div>
      )}

      {/* Stage Timeline Banner */}
      <StageTimeline
        currentStage={caseData.current_stage}
        stageEntryDate={caseData.stage_entry_date}
        statutoryDeadlineDate={caseData.statutory_deadline_date}
        benchmarkDeadlineDate={caseData.benchmark_deadline_date}
      />

      {/* ML Prediction & Explainability Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <RiskGauge
            probability={prediction?.risk_probability ?? null}
            level={prediction?.risk_level ?? null}
            quality={assessment?.metadata?.prediction_quality}
            model_version={assessment?.model_version}
            assessedAt={assessment?.predicted_at}
          />
        </div>
        <div className="lg:col-span-2">
          <SHAPFactorsList
            factors={explanation?.top_factors || []}
            baseProbability={explanation?.base_probability}
          />
        </div>
      </div>

      {/* Corrective Action Recommendations */}
      <RecommendationsList recommendations={recommendations} />

      {/* Case Data Exploration Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs transition-colors">
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <button
            onClick={() => setActiveTab("COMPENSATION")}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "COMPENSATION"
                ? "bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 border border-[#D7E2EC] dark:border-slate-700"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Compensation & Awards</span>
          </button>
          <button
            onClick={() => setActiveTab("LEGAL")}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "LEGAL"
                ? "bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 border border-[#D7E2EC] dark:border-slate-700"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Litigation & Stays</span>
          </button>
          <button
            onClick={() => setActiveTab("STAKEHOLDER")}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "STAKEHOLDER"
                ? "bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 border border-[#D7E2EC] dark:border-slate-700"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Stakeholders & Land Titles</span>
          </button>
        </div>

        {activeTab === "COMPENSATION" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Awarded Outlay</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {formatCurrencyCrores(caseData.comp_awarded_crore)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Disbursed Amount</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {formatCurrencyCrores(caseData.comp_disbursed_crore)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Disputed Cases</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {caseData.comp_disputes_pending} pending claims
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Max Days Pending</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {caseData.max_pending_days_comp} days
              </span>
            </div>
          </div>
        )}

        {activeTab === "LEGAL" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Active Court Stay Status:</span>
                <span className="ml-2 font-semibold text-slate-700 dark:text-slate-300">
                  {caseData.court_stay_active ? "Restraining Injunction Active" : "No Active Injunction"}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  caseData.court_stay_active
                    ? "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {caseData.court_stay_active ? "STAY ACTIVE" : "CLEAR"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400 font-medium block">Pending Legal Disputes</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                  {caseData.legal_cases_pending} court cases
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400 font-medium block">Average Dispute Age</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                  {caseData.avg_dispute_age_days} days in court
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "STAKEHOLDER" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Clear Title Verification</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {formatPercentage(caseData.clear_title_percent)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Public Hearing Status</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {caseData.public_hearing_held ? "Conducted & Documented" : "Pending Session"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Formal Objections</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {caseData.objections_filed_count} recorded
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Stakeholder Meetings</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {caseData.stakeholder_meetings_count} sessions held
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
