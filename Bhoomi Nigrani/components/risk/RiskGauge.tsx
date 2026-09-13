import React from "react";
import { RiskLevel, PredictionQuality } from "@/shared/types/ml-contract";
import { getRiskLevelBadgeClass, getRiskLevelColor } from "@/lib/utils/formatters";
import { Cpu } from "lucide-react";

interface RiskGaugeProps {
  probability: number | null | undefined;
  level: RiskLevel | null | undefined;
  quality?: PredictionQuality;
  model_version?: string;
  assessedAt?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  probability,
  level,
  quality,
  model_version,
  assessedAt,
}) => {
  const isAssessed =
    probability !== null &&
    probability !== undefined &&
    level !== null &&
    level !== undefined;

  const percentage = isAssessed ? Math.round(probability * 100) : null;
  const color = isAssessed ? getRiskLevelColor(level) : "#94a3b8";
  const badgeClass = isAssessed
    ? getRiskLevelBadgeClass(level)
    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";

  // 180-degree upper semicircle SVG math
  // Arc from (16, 80) to (144, 80) with radius 64
  const radius = 64;
  const arcLength = Math.PI * radius; // ~201.06
  const normalizedProb = isAssessed ? Math.max(0, Math.min(1, probability!)) : 0;
  const strokeDashoffset = arcLength - normalizedProb * arcLength;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col items-center justify-between h-full transition-colors">
      {/* Header Label */}
      <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Delay Risk Assessment
        </span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
          {isAssessed ? "Status: Evaluated" : "Status: Pending"}
        </span>
      </div>

      {/* 180-Degree Arc Visualization */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg viewBox="0 0 160 95" className="w-44 h-28">
          {/* Background Arc Path */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Data Arc Path */}
          {isAssessed && (
            <path
              d="M 16 80 A 64 64 0 0 1 144 80"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          )}
        </svg>

        {/* Center Numerical Value */}
        <div className="absolute top-12 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-100 font-mono tabular-nums">
            {isAssessed ? `${percentage}%` : "--"}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider -mt-0.5">
            {isAssessed ? "Delay Probability" : "Not Evaluated"}
          </span>
        </div>
      </div>

      {/* Risk Tier Badge & Metadata */}
      <div className="w-full mt-2 flex flex-col items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span
          className={`px-2.5 py-0.5 rounded text-xs font-bold border tracking-wider uppercase ${badgeClass}`}
        >
          {isAssessed ? `${level} RISK` : "ASSESSMENT PENDING"}
        </span>

        {/* Model Provenance Indicator */}
        <div className="w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
          <Cpu className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          {quality === "STUB" ? (
            <span>Inference: Stub Provider (Trained Model Pending)</span>
          ) : model_version ? (
            <span>Model Version: {model_version}</span>
          ) : (
            <span>Inference not yet requested</span>
          )}
        </div>

        {isAssessed && assessedAt && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            Evaluated: {new Date(assessedAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
};
