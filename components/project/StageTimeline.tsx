import React from "react";
import { AcquisitionStage } from "@/shared/types/ml-contract";
import { ORDERED_STAGES, STAGE_STANDARDS } from "@/lib/utils/constants";
import { Check, Clock, AlertCircle } from "lucide-react";

interface StageTimelineProps {
  currentStage: AcquisitionStage;
  stageEntryDate: string;
  statutoryDeadlineDate?: string | null;
  benchmarkDeadlineDate?: string | null;
}

export const StageTimeline: React.FC<StageTimelineProps> = ({
  currentStage,
  stageEntryDate,
  statutoryDeadlineDate,
  benchmarkDeadlineDate,
}) => {
  const currentIndex = ORDERED_STAGES.indexOf(currentStage);

  const activeDeadline = statutoryDeadlineDate || benchmarkDeadlineDate;
  const isOverdue = activeDeadline ? new Date(activeDeadline).getTime() < Date.now() : false;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Acquisition Lifecycle Progression
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Sequential progression milestones and operational pacing targets.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Statutory Target</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Operational Benchmark</span>
          </div>
        </div>
      </div>

      {/* Progress timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ORDERED_STAGES.filter((s) => s !== "CLOSED").map((stage, idx) => {
          const standard = STAGE_STANDARDS[stage];
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={stage}
              className={`p-3 rounded-lg border relative flex flex-col justify-between min-h-[110px] ${
                isCurrent
                  ? isOverdue
                    ? "bg-red-50/50 dark:bg-red-950/40 border-red-300 dark:border-red-800 ring-1 ring-red-400 dark:ring-red-600"
                    : "bg-blue-50/50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-1 ring-blue-400 dark:ring-blue-600"
                  : isPassed
                  ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Stage {idx + 1}
                  </span>
                  {isPassed ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : isCurrent ? (
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        isOverdue
                          ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                    </div>
                  ) : null}
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1.5">{stage}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                  {standard.label}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border inline-block ${
                    standard.isStatutory
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {standard.defaultDays}d • {standard.authority === "STATUTORY_MANDATE" ? "Statutory" : "Benchmark"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current stage status alert */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isOverdue ? (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="text-slate-700 dark:text-slate-300">
            Current Stage entered on <strong className="text-slate-900 dark:text-slate-100">{stageEntryDate}</strong>. Applicable target deadline:{" "}
            <strong className="text-slate-900 dark:text-slate-100">{activeDeadline || "Open"}</strong>.
          </span>
        </div>
        {isOverdue && (
          <span className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[11px] font-bold px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
            OVERDUE
          </span>
        )}
      </div>
    </div>
  );
};
