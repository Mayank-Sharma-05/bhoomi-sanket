"use client";

import React, { useState, useEffect } from "react";
import { History, ShieldCheck, Search } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function AuditLogsPage() {
  const { t } = useT();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/v1/admin/audit-logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLogs(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
              {t("audit.title")}
            </h1>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {t("audit.appendOnly")}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t("audit.desc")}
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t("audit.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-56"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">{t("audit.colTimestamp")}</th>
              <th className="py-3 px-4">{t("audit.colAction")}</th>
              <th className="py-3 px-4">{t("audit.colEntity")}</th>
              <th className="py-3 px-4">{t("audit.colOfficer")}</th>
              <th className="py-3 px-4">{t("audit.colDetails")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500">
                  {t("audit.noLogs")}
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {new Date(log.created_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded text-[11px] border border-blue-100 dark:border-blue-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 capitalize">
                    {log.entity_type}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {log.user_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
