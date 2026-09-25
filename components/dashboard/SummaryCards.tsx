import React from "react";
import { FolderKanban, Layers, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatPercentage } from "@/lib/utils/formatters";
import { CountUpMetric } from "@/components/ui/CountUpMetric";
import { useT } from "@/lib/i18n/LanguageProvider";

interface SummaryData {
  total_projects: number;
  total_cases: number;
  active_cases: number;
  critical_cases: number;
  high_risk_cases: number;
  medium_risk_cases: number;
  low_risk_cases: number;
  avg_risk_probability: number;
}

interface SummaryCardsProps {
  data?: any;
  loading?: boolean;
  projects?: any[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, loading, projects }) => {
  const { t } = useT();

  const totalProjects = Number(
    data?.total_projects ??
    data?.projects ??
    data?.totalProjects ??
    (projects?.length) ??
    0
  );

  const fallbackTotalCases = projects && projects.length > 0
    ? projects.reduce((acc: number, p: any) => acc + (p.total_cases || 0), 0)
    : 0;

  const totalCases = Number(
    data?.total_cases ??
    data?.packages ??
    data?.totalPackages ??
    data?.cases ??
    data?.totalCases ??
    fallbackTotalCases
  );

  const fallbackActiveCases = projects && projects.length > 0
    ? projects.reduce((acc: number, p: any) => acc + (p.active_cases || 0), 0)
    : totalCases;

  const activeCases = Number(
    data?.active_cases ??
    data?.activeCases ??
    data?.active ??
    fallbackActiveCases
  );

  const criticalCases = Number(
    data?.critical_cases ??
    data?.criticalCases ??
    data?.critical ??
    0
  );

  const fallbackHighRisk = projects && projects.length > 0
    ? projects.filter((p: any) => p.highest_risk_tier === "HIGH").length
    : 0;

  const highRiskCases = Number(
    data?.high_risk_cases ??
    data?.highRiskCases ??
    data?.high ??
    fallbackHighRisk
  );

  const highRiskCount = highRiskCases + criticalCases;

  const fallbackAvgRisk = projects && projects.length > 0
    ? Number((projects.reduce((acc: number, p: any) => acc + (p.avg_risk_probability || 0), 0) / projects.length).toFixed(3))
    : 0;

  const avgRiskProbability = Number(
    data?.avg_risk_probability ??
    data?.avgRiskProbability ??
    data?.avg_risk ??
    data?.risk_index ??
    data?.riskIndex ??
    fallbackAvgRisk
  );

  const hasAssessedData = totalCases > 0 && (avgRiskProbability > 0 || highRiskCount > 0);
  const avgRiskPercentage = (avgRiskProbability * 100).toFixed(1);

  console.log("[SummaryCards values]:", {
    totalProjects,
    totalCases,
    activeCases,
    criticalCases,
    highRiskCases,
    highRiskCount,
    avgRiskProbability,
    hasAssessedData,
    avgRiskPercentage,
  });

  if (loading || (!data && (!projects || projects.length === 0))) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: t("summary.infraProjects"),
      value: totalProjects,
      context: totalProjects === 0 ? t("summary.noActiveProjects") : `${totalCases} ${t("summary.totalPackages")}`,
      footnote: t("summary.infraContext"),
      icon: FolderKanban,
      iconColor: "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      alertStatus: false,
    },
    {
      title: t("summary.acquisitionPackages"),
      value: totalCases,
      context: totalCases === 0 ? "0 " + t("summary.activeInPipeline") : `${activeCases} ${t("summary.activeInPipeline")}`,
      footnote: t("summary.trackedRounds"),
      icon: Layers,
      iconColor: "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      alertStatus: false,
    },
    {
      title: t("summary.highRiskPackages"),
      value: highRiskCount,
      context:
        highRiskCount > 0
          ? `${criticalCases} ${t("summary.critical")} • ${highRiskCases} ${t("summary.high")}`
          : t("summary.zeroBreaches"),
      footnote: t("summary.approachingLimits"),
      icon: AlertTriangle,
      iconColor:
        highRiskCount > 0
          ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60"
          : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      alertStatus: highRiskCount > 0,
    },
    {
      title: t("summary.avgRiskIndex"),
      value: hasAssessedData ? avgRiskPercentage : "--",
      suffix: hasAssessedData ? "%" : "",
      decimalPlaces: 1,
      context: hasAssessedData ? t("summary.calibratedOutput") : t("summary.awaitingAssessment"),
      footnote: t("summary.crossPackage"),
      icon: ShieldCheck,
      iconColor: hasAssessedData
        ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60"
        : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      alertStatus: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="gov-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-250 hover:-translate-y-1"
          >
            {/* Header: Title & Restrained Icon Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-1.5 rounded border ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Telemetry Metric */}
            <div className="mt-2.5">
              <div className="text-2xl font-black text-slate-950 dark:text-slate-100 font-mono tracking-tight tabular-nums">
                <CountUpMetric
                  value={card.value}
                  suffix={(card as any).suffix || ""}
                  decimalPlaces={(card as any).decimalPlaces ?? 0}
                  className="text-2xl font-black text-slate-950 dark:text-slate-100 font-mono tracking-tight"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {card.alertStatus && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                )}
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{card.context}</span>
              </div>
            </div>

            {/* Context Footnote */}
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {card.footnote}
            </div>
          </div>
        );
      })}
    </div>
  );
};
