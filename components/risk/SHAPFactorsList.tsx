import React from "react";
import { SHAPFactor } from "@/shared/types/ml-contract";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";

interface SHAPFactorsListProps {
  factors?: SHAPFactor[];
  baseProbability?: number;
}

export const SHAPFactorsList: React.FC<SHAPFactorsListProps> = ({
  factors = [],
  baseProbability,
}) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center h-full flex flex-col items-center justify-center shadow-xs transition-colors">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
          <Info className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Feature Attribution Unavailable
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
          Local SHAP contributions will populate when an ML inference evaluation is triggered for this case.
        </p>
      </div>
    );
  }

  // Calculate scaling based strictly on maximum absolute SHAP value present in real data
  const maxAbsShap = Math.max(...factors.map((f) => Math.abs(f.shap_value)), 0.05);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs h-full flex flex-col justify-between transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Delay Risk Drivers (SHAP Local Attribution)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Relative impact of case parameters toward evaluated delay probability.
          </p>
        </div>

        {baseProbability !== undefined && (
          <span className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-mono">
            Base Prior: {(baseProbability * 100).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Center Diverging Waterfall Legend */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded mb-3">
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">◀ Mitigating Factors (-Risk)</span>
        <span className="text-slate-400 dark:text-slate-500">Baseline (0.0%)</span>
        <span className="text-red-700 dark:text-red-400 font-semibold">Risk Drivers (+Risk) ▶</span>
      </div>

      {/* Diverging Waterfall Rows */}
      <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
        {factors.map((factor, idx) => {
          const isRiskIncreaser = factor.direction === "INCREASES_RISK";
          const barWidthPercent = Math.min(
            100,
            Math.round((Math.abs(factor.shap_value) / maxAbsShap) * 100)
          );

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  {isRiskIncreaser ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-medium">{factor.label}</span>
                </div>

                <span
                  className={`font-mono text-[11px] font-bold tabular-nums ${
                    isRiskIncreaser ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {isRiskIncreaser ? "+" : ""}
                  {(factor.shap_value * 100).toFixed(1)}%
                </span>
              </div>

              {/* Split Center-Diverging Track */}
              <div className="w-full grid grid-cols-2 h-2 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative">
                {/* Left Side: Negative Contributions */}
                <div className="flex justify-end border-r border-slate-300 dark:border-slate-700">
                  {!isRiskIncreaser && (
                    <div
                      className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-l"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  )}
                </div>

                {/* Right Side: Positive Contributions */}
                <div className="flex justify-start">
                  {isRiskIncreaser && (
                    <div
                      className="bg-red-600 dark:bg-red-500 h-full rounded-r"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center">
        Normalized against max local parameter deviation in current inference vector
      </div>
    </div>
  );
};
