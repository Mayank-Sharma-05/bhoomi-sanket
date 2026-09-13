"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { HeroHeader } from "@/components/dashboard/HeroHeader";
import { ProjectRankList } from "@/components/dashboard/ProjectRankList";
import { AlertDrawer } from "@/components/dashboard/AlertDrawer";
import { DashboardRiskMap } from "@/components/dashboard/DashboardRiskMap";
import { DashboardFAQ } from "@/components/dashboard/DashboardFAQ";
import { RefreshCw, Clock } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function DashboardPage() {
  const { t } = useT();
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [gisFeatures, setGisFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const fetchData = async () => {
    try {
      const [sumRes, projRes, alertRes, gisRes] = await Promise.all([
        fetch("/api/v1/analytics/summary"),
        fetch("/api/v1/projects"),
        fetch("/api/v1/alerts"),
        fetch("/api/v1/gis/projects"),
      ]);

      const [sumData, projData, alertData, gisData] = await Promise.all([
        sumRes.json(),
        projRes.json(),
        alertRes.json(),
        gisRes.json(),
      ]);

      if (sumData.success) setSummary(sumData.data);
      if (projData.success) setProjects(projData.data);
      if (alertData.success) setAlerts(alertData.data);
      if (gisData.features) setGisFeatures(gisData.features);

      setLastSyncTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const res = await fetch("/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
        );
      }
    } catch (e) {
      console.error("Failed to acknowledge alert:", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Government-Grade Dashboard Hero */}
      <HeroHeader data={summary} loading={loading} />

      <div className="flex items-center justify-end gap-2">
        {lastSyncTime && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-[#D7E2EC] dark:border-slate-800 rounded text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>{t("dashboard.synced")} {lastSyncTime}</span>
          </div>
        )}

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-[#D7E2EC] dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3 h-3 ${refreshing ? "animate-spin text-blue-600 dark:text-blue-400" : ""}`}
          />
          <span>{refreshing ? t("dashboard.updating") : t("dashboard.refresh")}</span>
        </button>
      </div>

      {/* Telemetry KPI Strip */}
      <SummaryCards data={summary} loading={loading} />

      {/* Prominent Project Risk Map Section */}
      <DashboardRiskMap
        projects={projects}
        features={gisFeatures}
        loading={loading}
      />

      {/* Main Grid: Portfolio Risk Matrix (2/3) + Early Warning Feed (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ProjectRankList projects={projects} />
        </div>
        <div className="lg:col-span-1">
          <AlertDrawer alerts={alerts} onAcknowledge={handleAcknowledge} />
        </div>
      </div>

      {/* Frequently Asked Questions Section */}
      <DashboardFAQ />
    </motion.div>
  );
}
