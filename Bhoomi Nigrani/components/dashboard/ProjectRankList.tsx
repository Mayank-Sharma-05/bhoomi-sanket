"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatPercentage, getRiskLevelBadgeClass } from "@/lib/utils/formatters";
import { RiskLevel } from "@/shared/types/ml-contract";
import { ChevronRight, Search, FolderKanban, Plus, X } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

interface ProjectSummaryItem {
  id: string;
  project_name: string;
  project_type: string;
  funding_model: string;
  district_name: string;
  state_code: string;
  total_cases: number;
  active_cases: number;
  highest_risk_tier: RiskLevel;
  avg_risk_probability: number;
  is_demo_data?: boolean;
}

interface ProjectRankListProps {
  projects: ProjectSummaryItem[];
}

export const ProjectRankList: React.FC<ProjectRankListProps> = ({ projects }) => {
  const { t } = useT();
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>(" ");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterTier]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesTier = filterTier === "ALL" || p.highest_risk_tier === filterTier;
      if (!matchesTier) return false;
      if (!q) return true;
      return (
        p.project_name.toLowerCase().includes(q) ||
        p.district_name.toLowerCase().includes(q) ||
        p.state_code.toLowerCase().includes(q)
      );
    });
  }, [projects, filterTier, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const getTierDot = (tier: RiskLevel) => {
    switch (tier) {
      case "CRITICAL":
        return "bg-red-600";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-amber-500";
      case "LOW":
        return "bg-emerald-600";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden transition-colors">
      {/* Table Header & Faceted Controls */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {t("projects.portfolio")}
            </h3>
            <span className="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
              {projects.length} {t("projects.total")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t("projects.monitoringDesc")}
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center h-8">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder={t("projects.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full text-xs pl-8 pr-7 bg-slate-100/70 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="h-8 text-xs px-2.5 bg-slate-100/70 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">{t("projects.allRiskTiers")}</option>
              <option value="CRITICAL">{t("common.critical")}</option>
              <option value="HIGH">{t("common.high")}</option>
              <option value="MEDIUM">{t("common.medium")}</option>
              <option value="LOW">{t("common.low")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Projects Table / Empty State */}
      {projects.length === 0 ? (
        <div className="py-14 px-6 text-center bg-slate-50/40 dark:bg-slate-950/40">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{t("projects.noProjectsTitle")}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {t("projects.noProjectsDesc")}
          </p>
          <div className="mt-3.5">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 rounded text-xs font-semibold hover:bg-[#C7E4FA] dark:hover:bg-slate-700 transition-colors shadow-xs border border-[#D7E2EC] dark:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("projects.addProject")}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px] z-10">
              <tr>
                <th className="py-2.5 px-3.5">{t("projects.colName")}</th>
                <th className="py-2.5 px-3">{t("projects.colJurisdiction")}</th>
                <th className="py-2.5 px-3">{t("projects.colType")}</th>
                <th className="py-2.5 px-3">{t("projects.colPipeline")}</th>
                <th className="py-2.5 px-3">{t("projects.colRiskTier")}</th>
                <th className="py-2.5 px-3">{t("projects.colDelayProb")}</th>
                <th className="py-2.5 px-3 text-right">{t("projects.colDossier")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                    {t("projects.noMatches")}
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => {
                  const badgeClass = getRiskLevelBadgeClass(p.highest_risk_tier);
                  const dotColor = getTierDot(p.highest_risk_tier);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-100 h-10"
                    >
                      <td className="py-2 px-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {p.project_name}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                        {p.district_name}, <span className="font-mono text-[11px]">{p.state_code}</span>
                      </td>
                      <td className="py-2 px-3 capitalize text-slate-600 dark:text-slate-300 text-[11px]">
                        {p.project_type} <span className="text-slate-400 dark:text-slate-500">({p.funding_model})</span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px]">
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{p.active_cases}</span>
                        <span className="text-slate-400 dark:text-slate-500"> / {p.total_cases} {t("projects.active")}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {p.highest_risk_tier}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {p.total_cases > 0 && p.avg_risk_probability > 0
                          ? formatPercentage(p.avg_risk_probability * 100)
                          : "--"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link
                          href={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                        >
                          <span>{t("projects.inspect")}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filtered.length > pageSize && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div>
            {t("projects.showing")} <span className="font-bold text-slate-900 dark:text-slate-100">{(page - 1) * pageSize + 1}</span> {t("projects.to")}{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(page * pageSize, filtered.length)}</span> {t("projects.of")}{" "}
            <span className="font-bold text-slate-900 dark:text-slate-100">{filtered.length}</span> {t("projects.projects")}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer text-slate-700 dark:text-slate-200"
            >
              {t("projects.previous")}
            </button>
            <span className="px-2 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {t("projects.page")} {page} {t("projects.of")} {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer text-slate-700 dark:text-slate-200"
            >
              {t("projects.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
