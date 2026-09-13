"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DemoAlert } from "@/lib/data/mockStore";
import { getRiskLevelBadgeClass } from "@/lib/utils/formatters";
import { Bell, Check, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

interface AlertDrawerProps {
  alerts: DemoAlert[];
  onAcknowledge: (alertId: string) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({ alerts, onAcknowledge }) => {
  const { t } = useT();
  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-xs flex flex-col h-full transition-colors">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {t("alerts.earlyWarningStream")}
          </h3>
        </div>
        {unacknowledged.length > 0 ? (
          <span className="text-[10px] bg-red-50/80 dark:bg-red-950/50 backdrop-blur-xs text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded border border-red-200 dark:border-red-900/60 font-mono">
            {unacknowledged.length} {t("alerts.pending")}
          </span>
        ) : (
          <span className="text-[10px] bg-emerald-50/80 dark:bg-emerald-950/50 backdrop-blur-xs text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3 h-3" /> {t("alerts.allClear")}
          </span>
        )}
      </div>

      {/* Warning Feed / Empty State */}
      {unacknowledged.length === 0 ? (
        <div className="text-center py-12 px-4 my-auto bg-slate-50/40 dark:bg-slate-950/40 rounded border border-dashed border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto mb-2 stroke-[1.5]" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{t("alerts.zeroViolations")}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {t("alerts.zeroDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-0.5">
          <AnimatePresence initial={false}>
            {unacknowledged.map((alert) => {
              const badgeClass = getRiskLevelBadgeClass(alert.severity);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.18 }}
                  className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-150 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1.5 py-0.2 rounded font-mono font-semibold uppercase border border-slate-200 dark:border-slate-600">
                        {alert.alert_type}
                      </span>
                    </div>
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    >
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{t("alerts.acknowledge")}</span>
                    </button>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {alert.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700">
                    <span className="truncate max-w-[160px] text-slate-500 dark:text-slate-400 font-sans font-medium">
                      {alert.case_title}
                    </span>
                    <span>
                      {new Date(alert.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
