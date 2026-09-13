"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectType, FundingModel } from "@/shared/types/ml-contract";

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    project_name: "",
    project_type: "highway" as ProjectType,
    funding_model: "government" as FundingModel,
    implementing_agency: "",
    district_name: "",
    district_id: 101,
    state_code: "UP",
    land_area_ha: 0,
    budget_crore: 0,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

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
        const createdId = data.data?.id;
        if (createdId) {
          router.push(`/projects/${createdId}/ingest`);
        } else {
          router.push("/projects");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
        <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
          Create Infrastructure Project
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Add an infrastructure project to begin tracking land acquisition phases.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Northern Industrial Bypass"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Project Type</label>
              <select
                value={formData.project_type}
                onChange={(e) =>
                  setFormData({ ...formData, project_type: e.target.value as ProjectType })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
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
              <label className="font-semibold text-slate-700 block mb-1">Funding Model</label>
              <select
                value={formData.funding_model}
                onChange={(e) =>
                  setFormData({ ...formData, funding_model: e.target.value as FundingModel })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              >
                <option value="government">Government</option>
                <option value="PPP">PPP</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">District Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pune"
                value={formData.district_name}
                onChange={(e) => setFormData({ ...formData, district_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">State Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. MH"
                value={formData.state_code}
                onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Land Footprint (Ha)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.land_area_ha || ""}
                onChange={(e) =>
                  setFormData({ ...formData, land_area_ha: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Budget Outlay (₹ Cr)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.budget_crore || ""}
                onChange={(e) =>
                  setFormData({ ...formData, budget_crore: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Implementing Agency</label>
            <input
              type="text"
              placeholder="e.g. NHAI / PWD"
              value={formData.implementing_agency}
              onChange={(e) => setFormData({ ...formData, implementing_agency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Brief project scope or alignment notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/projects"
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
