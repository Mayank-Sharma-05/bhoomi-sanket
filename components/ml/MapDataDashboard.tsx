"use client";

import React, { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function MapDataDashboard() {
  const { t } = useT();
  const [districts, setDistricts] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [districtRes, stateRes, projectRes] = await Promise.all([
        fetch("/api/district-risk"),
        fetch("/api/state-risk"),
        fetch("/api/project-map-data"),
      ]);
      const [districtJson, stateJson, projectJson] = await Promise.all([
        districtRes.json(),
        stateRes.json(),
        projectRes.json(),
      ]);
      if (districtJson.success) setDistricts(districtJson.data);
      if (stateJson.success) setStates(stateJson.data);
      if (projectJson.success) setProjects(projectJson.data);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <section className="border rounded p-4">
        <div className="font-bold">{t("analytics.districtHeatmap")}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {districts.map((d, i) => <div key={i} className="rounded border p-2">{d.district} - {d.risk_percentage}% - {d.latitude},{d.longitude}</div>)}
        </div>
      </section>
      <section className="border rounded p-4">
        <div className="font-bold">{t("analytics.stateRisk")}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {states.map((s, i) => <div key={i} className="rounded border p-2">{s.state} - {s.risk_percentage}% - {s.risk_level}</div>)}
        </div>
      </section>
      <section className="border rounded p-4">
        <div className="font-bold">{t("analytics.projectLayer")}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p, i) => <div key={i} className="rounded border p-2">{p.project_name} - {p.location} - {p.predicted_risk} - {p.risk_category}</div>)}
        </div>
      </section>
    </div>
  );
}
