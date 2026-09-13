"use client";

import React, { useState, useEffect } from "react";
import { Cpu, CheckCircle2, AlertCircle, Shield, Info, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function ModelInfoPage() {
  const { t } = useT();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchModelInfo = () => {
    fetch("/api/v1/admin/model-info")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  if (loading) {
    return <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />;
  }

  const health = data?.health;
  const info = data?.model_info;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
          {t("model.title")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {t("model.desc")}
        </p>
      </div>

      {/* Health Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t("model.serviceStatus")}{" "}
                <span className="uppercase text-blue-700 dark:text-blue-400">{health?.status || "OFFLINE"}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Internal URL: http://localhost:8000 | Lifespan Managed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-bold border ${
                health?.is_stub
                  ? "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                  : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
              }`}
            >
              {health?.is_stub ? "STUB MODE (DEV)" : "PRODUCTION ARTIFACT ACTIVE"}
            </span>
            <button
              onClick={fetchModelInfo}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">Loaded Model Version</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {info?.model_version || "N/A"}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">Contract Schema</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {info?.schema_version || "v1"}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">Input Features Count</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {info?.feature_count || 23} features
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-slate-500 dark:text-slate-400 font-medium block">Service Uptime</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 block">
              {health?.uptime_seconds || 0} seconds
            </span>
          </div>
        </div>
      </div>

      {/* Model Contract Explanation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          Model-Agnostic Integration Architecture
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Bhoomi Sanket implements a strict architectural firewall between the application and the
          machine learning model. The application defines only the feature extraction contract and
          inference request/response schema. When the ML team finishes training and testing the
          model, artifacts are placed in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">ml_service/artifacts/</code> and loaded on startup
          without any frontend or database code modifications.
        </p>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Shield className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>Anti-Leakage & Governance Assurances:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Features are extracted strictly as of evaluation timestamp T (forward-looking target).</li>
            <li>No post-delay facts or post-facto dispute resolutions leak into the inference vector.</li>
            <li>All model responses are archived immutably in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">risk_assessments</code> for auditability.</li>
            <li>In-app alerts are de-duplicated across 24-hour evaluation cycles.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
