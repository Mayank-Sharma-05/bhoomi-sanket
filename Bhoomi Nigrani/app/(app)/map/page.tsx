"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { getRiskLevelColor } from "@/lib/utils/formatters";
import { RiskLevel } from "@/shared/types/ml-contract";
import { MapPin, RefreshCw, Upload, Filter } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

// Dynamic Leaflet import (avoids window is not defined error in Next.js SSR)
const LeafletMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Popup, CircleMarker } = await import(
      "react-leaflet"
    );
    await import("leaflet/dist/leaflet.css");

    return function MapComponent({
      districts,
      projects,
      selectedTier,
    }: {
      districts: any[];
      projects: any[];
      selectedTier: string;
    }) {
      const filteredDistricts = useMemo(() => {
        if (selectedTier === "ALL") return districts;
        if (selectedTier === "UNAVAILABLE") {
          return districts.filter(
            (d) => d.properties?.highest_risk_tier === "UNAVAILABLE" || !d.properties?.highest_risk_tier
          );
        }
        return districts.filter(
          (d) => d.properties?.highest_risk_tier === selectedTier
        );
      }, [districts, selectedTier]);

      const filteredProjects = useMemo(() => {
        if (selectedTier === "ALL") return projects;
        if (selectedTier === "UNAVAILABLE") {
          return projects.filter(
            (p) => p.properties?.highest_risk_tier === "UNAVAILABLE" || !p.properties?.highest_risk_tier
          );
        }
        return projects.filter(
          (p) => p.properties?.highest_risk_tier === selectedTier
        );
      }, [projects, selectedTier]);

      return (
        <MapContainer
          center={[22.5, 79.0]} // Geographic center of India
          zoom={5}
          className="w-full h-full z-10"
          style={{ background: "#f8fafc" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Real District Risk Boundary Centroids */}
          {filteredDistricts.map((d, idx) => {
            const coords: [number, number] = [
              d.geometry.coordinates[1],
              d.geometry.coordinates[0],
            ];
            const riskTier = d.properties?.highest_risk_tier as string | undefined;
            const isAssessed = riskTier && riskTier !== "UNAVAILABLE" && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(riskTier);
            const color = isAssessed ? getRiskLevelColor(riskTier as RiskLevel) : "#94a3b8";

            return (
              <CircleMarker
                key={`dist-${idx}`}
                center={coords}
                radius={14}
                pathOptions={{
                  color: isAssessed ? color : "#64748b",
                  fillColor: color,
                  fillOpacity: isAssessed ? 0.45 : 0.25,
                  dashArray: isAssessed ? undefined : "4, 4",
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-2 text-xs space-y-1 font-sans">
                    <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                      {d.properties.district_name} District ({d.properties.state_code})
                    </div>
                    {isAssessed && d.properties.avg_risk_probability !== undefined && d.properties.avg_risk_probability !== null && (
                      <div className="text-slate-700">
                        Average Risk:{" "}
                        <strong className="font-mono tabular-nums">
                          {Math.round(d.properties.avg_risk_probability * 100)}%
                        </strong>
                      </div>
                    )}
                    {!isAssessed && (
                      <div className="py-1">
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 rounded border border-slate-200 text-slate-600">
                          Assessment Unavailable
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Outside trained model jurisdiction (Trained: GJ, KA, MH, OD, TN, UP)
                        </p>
                      </div>
                    )}
                    <div className="text-slate-600">Total Projects: {d.properties.total_projects || 0}</div>
                    <div className="text-slate-600">Active Packages: {d.properties.total_cases || 0}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Real Project Location Centroids (Clustered for performance) */}
          {(() => {
            const clusterMap = new Map<string, { count: number; primary: any }>();
            filteredProjects.forEach((p) => {
              const key = `${p.geometry.coordinates[0].toFixed(2)},${p.geometry.coordinates[1].toFixed(2)}`;
              if (!clusterMap.has(key)) {
                clusterMap.set(key, { count: 1, primary: p });
              } else {
                clusterMap.get(key)!.count++;
              }
            });

            return Array.from(clusterMap.values()).map(({ count, primary }, idx) => {
              const coords: [number, number] = [
                primary.geometry.coordinates[1],
                primary.geometry.coordinates[0],
              ];
              const riskTier = primary.properties?.highest_risk_tier as string | undefined;
              const isAssessed = riskTier && riskTier !== "UNAVAILABLE" && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(riskTier);
              const color = isAssessed ? getRiskLevelColor(riskTier as RiskLevel) : "#94a3b8";

              return (
                <CircleMarker
                  key={`proj-${idx}`}
                  center={coords}
                  radius={count > 1 ? 9 : 7}
                  pathOptions={{
                    color: isAssessed ? "#ffffff" : "#64748b",
                    fillColor: color,
                    fillOpacity: isAssessed ? 0.95 : 0.65,
                    dashArray: isAssessed ? undefined : "3, 3",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-2 text-xs space-y-1 font-sans">
                      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                        {primary.properties.project_name}
                        {count > 1 && (
                          <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                            +{count - 1} in cluster
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600">
                        {primary.properties.district_name}, {primary.properties.state_code}
                      </div>
                      <div className="capitalize text-slate-600 text-[11px]">
                        Type: {primary.properties.project_type}
                      </div>
                      <div className="text-slate-700">
                        {isAssessed ? (
                          <>
                            Risk Tier: <strong className="font-mono">{primary.properties.highest_risk_tier}</strong>
                          </>
                        ) : (
                          <div className="mt-1">
                            <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              Assessment Unavailable
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Model coverage: GJ, KA, MH, OD, TN, UP
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-slate-600">Packages: {primary.properties.total_cases || 0}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            });
          })()}
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-400 font-medium space-y-2">
        <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
        <span>Initializing Geospatial Map Canvas...</span>
      </div>
    ),
  }
);

export default function GISMapPage() {
  const { t } = useT();
  const [districts, setDistricts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  useEffect(() => {
    Promise.all([fetch("/api/v1/gis/districts"), fetch("/api/v1/gis/projects")])
      .then(async ([distRes, projRes]) => {
        const [distData, projData] = await Promise.all([distRes.json(), projRes.json()]);
        if (distData.features) setDistricts(distData.features);
        if (projData.features) setProjects(projData.features);
      })
      .catch((e) => console.error("Failed to load GIS data:", e))
      .finally(() => setLoading(false));
  }, []);

  const totalSpatialAssets = projects.length + districts.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="space-y-3.5"
    >
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
              {t("gis.title")}
            </h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {projects.length} {t("gis.mappedProjects")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {t("gis.desc")}
          </p>
        </div>

        {/* Global Coordinates Status */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hidden md:inline-block">
            CRS: EPSG:4326 (WGS 84)
          </span>
        </div>
      </div>

      {/* Map Canvas with Liquid Glass Floating HUD Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs relative h-[calc(100vh-210px)] min-h-[550px] transition-colors">
        {/* Top-Right Floating Filter HUD (Liquid Glass Surface) */}
        <div className="absolute top-3 right-3 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-lg p-1.5 shadow-md flex items-center gap-1 text-xs">
          <div className="flex items-center gap-1 px-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Filter className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span className="hidden sm:inline">Tier:</span>
          </div>
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "UNAVAILABLE"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                selectedTier === tier
                  ? "bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 shadow-xs border border-[#D7E2EC] dark:border-slate-700"
                  : "bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tier === "UNAVAILABLE" ? "UNASSESSED" : tier}
            </button>
          ))}
        </div>

        {/* Bottom-Left Floating Legend HUD (Liquid Glass Surface) */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-lg p-2.5 shadow-md text-xs space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t("gis.riskClassification")}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              {t("common.critical")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              {t("common.high")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              {t("common.medium")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              {t("common.low")}
            </span>
            <span className="flex items-center gap-1.5 col-span-2 border-t border-slate-100 dark:border-slate-800 pt-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 border border-slate-500 border-dashed shrink-0" />
              Assessment Unavailable (GIS Only)
            </span>
          </div>
        </div>

        {/* Professional Empty State Overlay when no spatial data exists */}
        {!loading && totalSpatialAssets === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-900/10 dark:bg-slate-950/40 pointer-events-none">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 max-w-sm w-full text-center shadow-md pointer-events-auto">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {t("gis.noDataTitle")}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {t("gis.noDataDesc")}
              </p>
              <div className="mt-4">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B7CCF3] dark:bg-slate-800 text-[#2F3A4A] dark:text-blue-300 rounded text-xs font-semibold hover:bg-[#C7E4FA] dark:hover:bg-slate-700 transition-colors shadow-xs border border-[#D7E2EC] dark:border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t("gis.viewRegistry")}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        <LeafletMap
          districts={districts}
          projects={projects}
          selectedTier={selectedTier}
        />
      </div>
    </motion.div>
  );
}
