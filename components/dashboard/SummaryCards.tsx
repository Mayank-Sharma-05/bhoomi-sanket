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
  data?: SummaryData;
  loading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, loading }) => {
  const { t } = useT();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const hasAssessedData = data.total_cases > 0 && data.avg_risk_probability > 0;
  const highRiskCount = data.high_risk_cases + data.critical_cases;

  const cards = [
    {
      title: t("summary.infraProjects"),
      value: data.total_projects,
      context: data.total_projects === 0 ? t("summary.noActiveProjects") : `${data.total_cases} ${t("summary.totalPackages")}`,
      footnote: t("summary.infraContext"),
      icon: FolderKanban,
      iconColor: "text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      alertStatus: false,
    },
    {
      title: t("summary.acquisitionPackages"),
      value: data.total_cases,
      context: data.total_cases === 0 ? "0 " + t("summary.activeInPipeline") : `${data.active_cases} ${t("summary.activeInPipeline")}`,
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
          ? `${data.critical_cases} ${t("summary.critical")} • ${data.high_risk_cases} ${t("summary.high")}`
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
      value: hasAssessedData ? formatPercentage(data.avg_risk_probability * 100) : "--",
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
                <CountUpMetric value={card.value} className="text-2xl font-black text-slate-950 dark:text-slate-100 font-mono tracking-tight" />
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
