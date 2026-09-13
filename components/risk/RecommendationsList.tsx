import React from "react";
import { ActionRecommendation } from "@/shared/types/ml-contract";
import { ShieldAlert, Scale, Banknote, FileText, Users, CheckCircle2 } from "lucide-react";

interface RecommendationsListProps {
  recommendations?: ActionRecommendation[];
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations = [],
}) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center shadow-xs transition-colors">
        <CheckCircle2 className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          No Corrective Protocols Required
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Operational intervention recommendations will populate if an assessment evaluates high risk or pending bottlenecks.
        </p>
      </div>
    );
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "LEGAL":
        return <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "COMPENSATION":
        return <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "DOCUMENTATION":
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "STAKEHOLDER":
        return <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs transition-colors">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Targeted Corrective Protocols
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Action recommendations mapped directly to evaluated risk parameters.
        </p>
      </div>

      <div className="space-y-2.5">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors duration-150 flex items-start gap-3"
          >
            <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 mt-0.5">
              {getCategoryIcon(rec.category)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{rec.action}</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-semibold px-1.5 py-0.2 rounded uppercase border border-slate-200 dark:border-slate-600">
                  {rec.category}
                </span>
                <span className="text-[9px] bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-mono font-semibold px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 ml-auto">
                  Priority #{rec.priority}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{rec.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
