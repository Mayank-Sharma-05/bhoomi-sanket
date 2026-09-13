"use client";

import React from "react";
import { useT } from "@/lib/i18n/LanguageProvider";

export const HeroStatus: React.FC = () => {
  const { t } = useT();

  const statuses = [
    {
      label: t("status.systemOperational"),
      color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    {
      label: t("status.mlModelActive"),
      color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    },
    {
      label: t("status.gisMonitoring"),
      color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      {statuses.map((item) => (
        <div
          key={item.label}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] rounded-full border ${item.color} transition-colors`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
