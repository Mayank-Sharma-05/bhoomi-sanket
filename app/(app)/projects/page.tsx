"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectRankList } from "@/components/dashboard/ProjectRankList";
import { Plus, X } from "lucide-react";
import { ProjectType, FundingModel } from "@/shared/types/ml-contract";
import { useT } from "@/lib/i18n/LanguageProvider";

export default function ProjectsPage() {
  const router = useRouter();
  const { t } = useT();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    project_name: "",
    project_type: "highway" as ProjectType,
    funding_model: "government" as FundingModel,
    implementing_agency: "",
    district_name: "",
    district_id: 1,
    state_code: "DL",
    land_area_ha: 0,
    budget_crore: 0,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = () => {
    fetch("/api/v1/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProjects(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setShowAddModal(false);
        const createdId = data.data?.id;
        if (createdId) {
          router.push(`/projects/${createdId}/ingest`);
        } else {
          fetchProjects();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
            {t("projectsPage.title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t("projectsPage.desc")}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 dark:bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("projectsPage.addProject")}</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse" />
      ) : (
        <ProjectRankList projects={projects} />
      )}

      {/* Add Project Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("projectsPage.modalTitle")}</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t("projectsPage.projectName")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Western Ring Expressway"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("projectsPage.projectType")}</label>
                  <select
                    value={formData.project_type}
                    onChange={(e) =>
                      setFormData({ ...formData, project_type: e.target.value as ProjectType })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="highway">Highway</option>
                    <option value="railway">Railway</option>
                    <option value="industrial">Industrial</option>
                    <option value="power">Power</option>
                    <option value="urban">Urban</option>
                    <option value="irrigation">Irrigation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("projectsPage.fundingModel")}</label>
                  <select
                    value={formData.funding_model}
                    onChange={(e) =>
                      setFormData({ ...formData, funding_model: e.target.value as FundingModel })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="government">Government</option>
                    <option value="PPP">PPP</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("projectsPage.districtName")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={formData.district_name}
                    onChange={(e) => setFormData({ ...formData, district_name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("projectsPage.stateCode")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH"
                    value={formData.state_code}
                    onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("projectsPage.landArea")}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.land_area_ha || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, land_area_ha: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("projectsPage.budget")}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.budget_crore || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, budget_crore: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{t("projectsPage.agency")}</label>
                <input
                  type="text"
                  placeholder="e.g. NHAI / State PWD"
                  value={formData.implementing_agency}
                  onChange={(e) => setFormData({ ...formData, implementing_agency: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  {t("projectsPage.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-900 dark:bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? t("projectsPage.creating") : t("projectsPage.saveProject")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
