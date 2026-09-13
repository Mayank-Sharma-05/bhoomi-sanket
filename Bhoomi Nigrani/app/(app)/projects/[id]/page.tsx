"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrencyCrores, getRiskLevelBadgeClass } from "@/lib/utils/formatters";
import { ArrowLeft, Plus, ChevronRight, Layers, Building, MapPin, X, Upload } from "lucide-react";
import { AcquisitionStage } from "@/shared/types/ml-contract";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCase, setShowAddCase] = useState(false);
  const [caseFormData, setCaseFormData] = useState({
    case_number: "",
    case_title: "",
    current_stage: "SIA" as AcquisitionStage,
  });
  const [submittingCase, setSubmittingCase] = useState(false);

  const fetchProject = () => {
    fetch(`/api/v1/projects/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProject(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCase(true);
    try {
      const res = await fetch(`/api/v1/projects/${params.id}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseFormData),
      });
      if (res.ok) {
        setShowAddCase(false);
        setCaseFormData({ case_number: "", case_title: "", current_stage: "SIA" });
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCase(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />;
  }

  if (!project) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center transition-colors">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Project not found.</p>
        <Link href="/projects" className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded uppercase border border-slate-200 dark:border-slate-700">
                {project.project_type}
              </span>
              <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {project.funding_model} Model
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 mt-2 tracking-tight">
              {project.project_name}
            </h1>
            {project.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-right">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Total Outlay</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatCurrencyCrores(project.budget_crore)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-right">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Land Footprint</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {project.land_area_ha || 0} Ha
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {project.implementing_agency && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Agency: {project.implementing_agency}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Location: {project.district_name}, {project.state_code}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Packages: {project.cases?.length || 0} Acquisition Rounds</span>
          </div>
        </div>
      </div>

      {/* Associated Acquisition Cases (1:many) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Acquisition Packages & Legal Phases
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Independent land acquisition rounds associated with this project.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}/ingest`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>Upload Acquisition Data</span>
            </Link>

            <button
              onClick={() => setShowAddCase(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 dark:bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package</span>
            </button>
          </div>
        </div>

        {(!project.cases || project.cases.length === 0) ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-200">No acquisition packages added yet</p>
            <p className="text-slate-400 dark:text-slate-500 mt-1">Upload acquisition data or manually add an acquisition phase to begin tracking stage progress.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href={`/projects/${project.id}/ingest`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Acquisition Data (CSV / XLSX / PDF)</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {project.cases.map((c: any) => {
              const riskLevel = c.latest_assessment?.prediction?.risk_level;
              const riskProb = c.latest_assessment?.prediction?.risk_probability;
              const hasAssessment = riskLevel !== undefined && riskProb !== undefined;
              const badgeClass = hasAssessment ? getRiskLevelBadgeClass(riskLevel) : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded font-mono border border-blue-200 dark:border-blue-800">
                        {c.case_number}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.case_title}</span>
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-semibold">
                        Stage: {c.current_stage}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
                      <span>Entered Stage: {c.stage_entry_date}</span>
                      {c.court_stay_active && (
                        <span className="text-red-600 dark:text-red-400 font-semibold">• Judicial Stay Active</span>
                      )}
                      {c.comp_disputes_pending > 0 && (
                        <span>• {c.comp_disputes_pending} Disputed Payments</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded border ${badgeClass}`}>
                        {hasAssessment ? `${riskLevel} (${Math.round(riskProb * 100)}%)` : "UNASSESSED"}
                      </span>
                    </div>
                    <Link
                      href={`/projects/${project.id}/cases/${c.id}`}
                      className="px-3 py-1.5 bg-blue-900 dark:bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Inspect Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Package Modal */}
      {showAddCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Acquisition Package</h3>
              <button
                onClick={() => setShowAddCase(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCase} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Package Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PKG-01 / REACH-A"
                  value={caseFormData.case_number}
                  onChange={(e) =>
                    setCaseFormData({ ...caseFormData, case_number: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Package Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Western Reach Right-of-Way"
                  value={caseFormData.case_title}
                  onChange={(e) =>
                    setCaseFormData({ ...caseFormData, case_title: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Starting Stage
                </label>
                <select
                  value={caseFormData.current_stage}
                  onChange={(e) =>
                    setCaseFormData({
                      ...caseFormData,
                      current_stage: e.target.value as AcquisitionStage,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="SIA">SIA (Social Impact Assessment)</option>
                  <option value="SECTION_11">Section 11 Notification</option>
                  <option value="SECTION_19">Section 19 Declaration</option>
                  <option value="AWARD">Award Stage</option>
                  <option value="POSSESSION">Possession Stage</option>
                  <option value="RR">Rehabilitation & Resettlement</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCase(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCase}
                  className="px-4 py-1.5 bg-blue-900 dark:bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCase ? "Adding..." : "Add Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
