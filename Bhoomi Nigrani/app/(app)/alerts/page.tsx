"use client";

import React, { useState, useEffect } from "react";
import { AlertDrawer } from "@/components/dashboard/AlertDrawer";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function AlertsPage() {
  const { t } = useT();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    fetch("/api/v1/alerts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAlerts(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
          {t("alerts.inboxTitle")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {t("alerts.inboxDesc")}
        </p>
      </div>

      {loading ? (
        <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
      ) : (
        <AlertDrawer alerts={alerts} onAcknowledge={handleAcknowledge} />
      )}
    </div>
  );
}
