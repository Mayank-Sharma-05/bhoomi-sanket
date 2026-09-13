"use client";

import React from "react";
import { FolderKanban, Layers, AlertTriangle, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

interface HeroStatsProps {
  data?: {
    total_projects?: number;
    total_cases?: number;
    high_risk_cases?: number;
    critical_cases?: number;
    avg_risk_probability?: number;
  } | null;
}

export const HeroStats: React.FC<HeroStatsProps> = ({ data }) => {
  const { t } = useT();
  const totalProjects = data?.total_projects ?? 0;
  const totalCases = data?.total_cases ?? 0;
  const highRiskCount = (data?.high_risk_cases ?? 0) + (data?.critical_cases ?? 0);
  const avgRisk = data?.avg_risk_probability ?? 0;

  const stats = [
    { label: t("stats.projects"), value: totalProjects, icon: FolderKanban },
    { label: t("stats.packages"), value: totalCases, icon: Layers },
    { label: t("stats.highRisk"), value: highRiskCount, icon: AlertTriangle },
    { label: t("stats.riskIndex"), value: `${Math.round(avgRisk * 100)}%`, icon: ShieldCheck },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mt-4 max-w-lg">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="flex items-center gap-2 rounded-xl border border-[#D7E2EC] dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-2 transition-colors">
            <span className="p-1.5 rounded bg-[#E7EEF5] dark:bg-slate-700 text-[#2F3A4A] dark:text-slate-200 border border-[#D7E2EC] dark:border-slate-600">
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{stat.label}</div>
              <div className="text-sm font-black text-[#2F3A4A] dark:text-slate-100 font-mono tabular-nums">{stat.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
