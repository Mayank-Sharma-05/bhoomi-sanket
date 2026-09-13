"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { getRiskLevelColor } from "@/lib/utils/formatters";
import { RiskLevel } from "@/shared/types/ml-contract";
import { Map as MapIcon, MapPin, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

interface DashboardRiskMapProps {
  projects: any[];
  features?: any[];
  loading?: boolean;
}

const LeafletMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Popup, CircleMarker } = await import(
      "react-leaflet"
    );
    await import("leaflet/dist/leaflet.css");

    return function MapComponent({
      markers,
    }: {
      markers: any[];
    }) {
      return (
        <MapContainer
          center={[22.5, 79.0]} // Center of India
          zoom={5}
          className="w-full h-full z-10"
          style={{ background: "#f8fafc" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {(() => {
            // Cluster markers by location to prevent thousands of overlapping SVG DOM nodes
            const clusterMap = new Map<string, { count: number; primary: any }>();
            markers.forEach((m) => {
              const key = `${m.geometry.coordinates[0].toFixed(2)},${m.geometry.coordinates[1].toFixed(2)}`;
              if (!clusterMap.has(key)) {
                clusterMap.set(key, { count: 1, primary: m });
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
                  key={`dash-marker-${idx}`}
                  center={coords}
                  radius={count > 1 ? 11 : 8}
                  pathOptions={{
                    color: isAssessed ? "#ffffff" : "#64748b",
                    fillColor: color,
                    fillOpacity: isAssessed ? 0.95 : 0.65,
                    dashArray: isAssessed ? undefined : "3, 3",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-1.5 text-xs font-sans space-y-1">
                      <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                        {primary.properties.project_name}
                        {count > 1 && (
                          <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                            +{count - 1} more in zone
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600">
                        {primary.properties.district_name}, {primary.properties.state_code}
                      </div>
                      <div className="capitalize text-slate-500 text-[11px]">
                        Type: {primary.properties.project_type}
                      </div>
                      <div className="text-slate-700">
                        {isAssessed ? (
                          <>
                            Risk Level: <strong className="font-mono">{primary.properties.highest_risk_tier}</strong>
                          </>
                        ) : (
                          <div className="mt-0.5">
                            <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              Assessment Unavailable
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Model coverage: GJ, KA, MH, OD, TN, UP
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-slate-600">
                        Packages: {primary.properties.total_cases || 0}
                      </div>
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
      <div className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-400 font-medium space-y-2">
        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
        <span>Loading Geospatial Risk Map...</span>
      </div>
    ),
  }
);

export const DashboardRiskMap: React.FC<DashboardRiskMapProps> = ({
  projects,
  features = [],
  loading = false,
}) => {
  const { t } = useT();
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Derive unique states from real features or projects
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    features.forEach((f) => {
      if (f.properties?.state_code) states.add(f.properties.state_code);
    });
    projects.forEach((p) => {
      if (p.state_code) states.add(p.state_code);
    });
    return Array.from(states).sort();
  }, [features, projects]);

  // Derive districts dependent on selected state
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>();
    const filterState = selectedState !== "ALL";

    features.forEach((f) => {
      if (!filterState || f.properties?.state_code === selectedState) {
        if (f.properties?.district_name) districts.add(f.properties.district_name);
      }
    });

    projects.forEach((p) => {
      if (!filterState || p.state_code === selectedState) {
        if (p.district_name) districts.add(p.district_name);
      }
    });

    return Array.from(districts).sort();
  }, [features, projects, selectedState]);

  // Derive unique project types from real features or projects
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    features.forEach((f) => {
      if (f.properties?.project_type) types.add(f.properties.project_type);
    });
    projects.forEach((p) => {
      if (p.project_type) types.add(p.project_type);
    });
    return Array.from(types).sort();
  }, [features, projects]);

  // Filter features based on the 3 dropdowns
  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      const stateMatch =
        selectedState === "ALL" || f.properties?.state_code === selectedState;
      const districtMatch =
        selectedDistrict === "ALL" ||
        f.properties?.district_name === selectedDistrict;
      const typeMatch =
        selectedType === "ALL" || f.properties?.project_type === selectedType;
      return stateMatch && districtMatch && typeMatch;
    });
  }, [features, selectedState, selectedDistrict, selectedType]);

  // Handle state change (reset district if state changes)
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("ALL");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden transition-colors">
      {/* Header with Title and Dependent Filters */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {t("riskMap.title")}
              </h3>
              <span className="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                {filteredFeatures.length} {t("riskMap.spatialAssets")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {t("riskMap.desc")}
            </p>
          </div>
        </div>

        {/* 3 Dependent Filter Dropdowns in Liquid Glass Container */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-100/70 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-700 rounded-md bg-white/90 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors"
          >
            <option value="ALL">{t("header.allStates")}</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          {/* District Filter (dependent on state) */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-700 rounded-md bg-white/90 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors"
          >
            <option value="ALL">{t("riskMap.allDistricts")}</option>
            {availableDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>

          {/* Project Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-700 rounded-md bg-white/90 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors capitalize"
          >
            <option value="ALL">{t("riskMap.allProjectTypes")}</option>
            {availableTypes.map((type) => (
              <option key={type} value={type} className="capitalize">
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Canvas with Floating Legend and Empty State */}
      <div className="relative h-[380px] bg-slate-50 dark:bg-slate-950">
        {/* Floating Liquid Glass Legend HUD (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-lg p-2.5 shadow-md text-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t("riskMap.legend")}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              {t("riskMap.highCritical")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              {t("riskMap.medium")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              {t("riskMap.low")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              Assessment Unavailable
            </span>
          </div>
        </div>

        {/* Polished Empty State Overlay if no geospatial data exists */}
        {!loading && filteredFeatures.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-900/5 dark:bg-slate-950/40 pointer-events-none">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 max-w-sm w-full text-center shadow-md pointer-events-auto">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {t("riskMap.noRecordsTitle")}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {features.length === 0
                  ? t("riskMap.noRecordsDesc")
                  : t("riskMap.noMatchesDesc")}
              </p>
            </div>
          </div>
        )}

        <LeafletMap markers={filteredFeatures} />
      </div>
    </div>
  );
};
