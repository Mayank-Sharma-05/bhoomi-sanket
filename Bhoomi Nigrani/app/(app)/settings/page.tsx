"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Shield,
  Bell,
  Monitor,
  Lock,
  Database,
  Info,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { useT } from "@/lib/i18n/LanguageProvider";

type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "display"
  | "privacy"
  | "system";

export default function SettingsPage() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Notification states (stored in local preferences)
  const [notifyCriticalRisk, setNotifyCriticalRisk] = useState(true);
  const [notifyMilestoneBreach, setNotifyMilestoneBreach] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);

  // Display states
  const [tableDensity, setTableDensity] = useState("compact");
  const [defaultMapZoom, setDefaultMapZoom] = useState("national");

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setUser(resData.data);
        }
      })
      .catch((err) => console.error("Error fetching user data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSavePreferences = () => {
    setSaveStatus(t("settings.prefsSaved"));
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const navItems = [
    { id: "profile", label: t("settings.profile"), icon: User },
    { id: "security", label: t("settings.security"), icon: Shield },
    { id: "notifications", label: t("settings.notifications"), icon: Bell },
    { id: "display", label: t("settings.display"), icon: Monitor },
    { id: "privacy", label: t("settings.privacy"), icon: Database },
    { id: "system", label: t("settings.system"), icon: Info },
  ];

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-base font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {t("settings.desc")}
          </p>
        </div>

        {saveStatus && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Settings Navigation Menu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 shadow-xs h-fit space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t("settings.configuration")}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? "bg-[#B7CCF3] dark:bg-blue-900/60 text-[#2F3A4A] dark:text-blue-200 font-semibold border border-[#D7E2EC] dark:border-blue-700/60"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* PROFILE SECTION */}
          {activeTab === "profile" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {t("settings.profileTitle")}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.profileDesc")}
                </p>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("settings.fullName")}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || "Authorized Officer"}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium cursor-not-allowed text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("settings.officialEmail")}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || "admin@bhoomisanket.gov.in"}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-mono text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("settings.roleAccess")}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.role || "ADMINISTRATOR"}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("settings.jurisdiction")}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.scope || "NATIONAL"}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{t("settings.identityNotice")}</span>
              </div>
            </div>
          )}

          {/* SECURITY SECTION */}
          {activeTab === "security" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {t("settings.authTitle")}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.authDesc")}
                </p>
              </div>

              <div className="space-y-3.5 max-w-md">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("settings.currentPassword")}
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("settings.newPassword")}
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new strong password"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("settings.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSavePreferences}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B7CCF3] dark:bg-blue-900/60 text-[#2F3A4A] dark:text-blue-200 text-xs font-semibold rounded hover:bg-[#C7E4FA] dark:hover:bg-blue-800/60 transition-colors shadow-xs cursor-pointer border border-[#D7E2EC] dark:border-blue-700/60"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{t("settings.updatePassword")}</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t("settings.sessionSecurity")}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("settings.sessionDesc")}</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                  PROTECTED
                </span>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeTab === "notifications" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {t("settings.notifTitle")}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.notifDesc")}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t("settings.criticalAlerts")}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("settings.criticalAlertsDesc")}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyCriticalRisk}
                    onChange={(e) => setNotifyCriticalRisk(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t("settings.deadlineAlerts")}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("settings.deadlineAlertsDesc")}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMilestoneBreach}
                    onChange={(e) => setNotifyMilestoneBreach(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t("settings.weeklyDigest")}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t("settings.weeklyDigestDesc")}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWeeklyDigest}
                    onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSavePreferences}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B7CCF3] dark:bg-blue-900/60 text-[#2F3A4A] dark:text-blue-200 text-xs font-semibold rounded hover:bg-[#C7E4FA] dark:hover:bg-blue-800/60 transition-colors shadow-xs cursor-pointer border border-[#D7E2EC] dark:border-blue-700/60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t("settings.saveNotif")}</span>
                </button>
              </div>
            </div>
          )}

          {/* DISPLAY PREFERENCES */}
          {activeTab === "display" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {t("settings.displayTitle")}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.displayDesc")}
                </p>
              </div>

              <div className="space-y-4 max-w-md text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Default Geospatial Viewport
                  </label>
                  <select
                    value={defaultMapZoom}
                    onChange={(e) => setDefaultMapZoom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="national">National Overview (India Center [22.5° N, 79.0° E])</option>
                    <option value="district">Auto-fit Available Projects</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Table Data Density
                  </label>
                  <select
                    value={tableDensity}
                    onChange={(e) => setTableDensity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="compact">High-Density (38px row height - Recommended)</option>
                    <option value="standard">Standard (46px row height)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSavePreferences}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B7CCF3] dark:bg-blue-900/60 text-[#2F3A4A] dark:text-blue-200 text-xs font-semibold rounded hover:bg-[#C7E4FA] dark:hover:bg-blue-800/60 transition-colors shadow-xs cursor-pointer border border-[#D7E2EC] dark:border-blue-700/60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t("settings.applyDisplay")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY & AUDIT */}
          {activeTab === "privacy" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {t("settings.privacyTitle")}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.privacyDesc")}
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{t("settings.auditProtocol")}</span>
                    <span className="text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {t("settings.auditActive")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t("settings.auditDesc")}
                  </p>
                </div>

                <div className="pt-1">
                  <a
                    href="/admin/audit-logs"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                  >
                    <span>{t("settings.viewAudit")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM INFORMATION (READ-ONLY) */}
          {activeTab === "system" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {t("settings.systemTitle")}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.systemDesc")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Application Version</span>
                  <span className="block text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">v0.1.0</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ML Contract Schema</span>
                  <span className="block text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">v1 (22 Feature Vector)</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Geospatial Engine</span>
                  <span className="block text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">Leaflet 1.9.4 / EPSG:4326</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Core Framework</span>
                  <span className="block text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">Next.js 14.2 (App Router)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{t("settings.inferenceStatus")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
