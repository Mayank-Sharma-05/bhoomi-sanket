"use client";

import React, { useState } from "react";
import { FileText, AlertTriangle, CheckCircle2, FileCheck } from "lucide-react";
import { AcquisitionStage } from "@/shared/types/ml-contract";

interface PdfVerificationPanelProps {
  filename: string;
  extractedSnippet: string;
  initialFields: Record<string, any>;
  reliable: boolean;
  message?: string;
  onConfirmFields: (fields: Record<string, any>) => void;
}

export const PdfVerificationPanel: React.FC<PdfVerificationPanelProps> = ({
  filename,
  extractedSnippet,
  initialFields,
  reliable,
  message,
  onConfirmFields,
}) => {
  const [fields, setFields] = useState({
    case_number: initialFields.case_number || "",
    case_title: initialFields.case_title || "",
    current_stage: (initialFields.current_stage as AcquisitionStage) || "SIA",
    stage_entry_date: initialFields.stage_entry_date || new Date().toISOString().split("T")[0],
    land_area_ha: initialFields.land_area_ha !== undefined ? String(initialFields.land_area_ha) : "",
    num_affected_families:
      initialFields.num_affected_families !== undefined
        ? String(initialFields.num_affected_families)
        : "",
  });

  const handleChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onConfirmFields({
      ...fields,
      land_area_ha: fields.land_area_ha ? parseFloat(fields.land_area_ha) : 0,
      num_affected_families: fields.num_affected_families
        ? parseInt(fields.num_affected_families, 10)
        : 0,
    });
  };

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      {/* Document status header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              PDF Gazette Document Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{filename}</p>
          </div>
        </div>

        {reliable ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Landmark Patterns Detected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Verification Required
          </span>
        )}
      </div>

      {!reliable && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Document Parsing Notice</p>
            <p className="mt-0.5">
              {message ||
                "Unable to reliably extract structured data from this document. Please verify the extracted information or upload a CSV/XLSX file."}
            </p>
          </div>
        </div>
      )}

      {/* Side-by-side: Extracted Text vs Verified Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Raw Document Text Snippet */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Extracted Gazette Text (Reference)
          </label>
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 h-64 overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {extractedSnippet || "No readable text stream detected in this PDF document."}
          </div>
        </div>

        {/* Right: Field Inputs for Human-in-the-Loop Confirmation */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Extracted Field Values
          </label>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Package ID / Notification Number *
              </label>
              <input
                type="text"
                value={fields.case_number}
                onChange={(e) => handleChange("case_number", e.target.value)}
                placeholder="e.g. PKG-001 or Notification #452"
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                Project / Case Title
              </label>
              <input
                type="text"
                value={fields.case_title}
                onChange={(e) => handleChange("case_title", e.target.value)}
                placeholder="e.g. Land Acquisition for Bypass Sector A"
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Current Stage *
                </label>
                <select
                  value={fields.current_stage}
                  onChange={(e) => handleChange("current_stage", e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                >
                  <option value="SIA">Social Impact Assessment (SIA)</option>
                  <option value="SECTION_11">Section 11 Preliminary Notification</option>
                  <option value="SECTION_19">Section 19 Declaration of Acquisition</option>
                  <option value="AWARD">Enquiry & Award of Compensation</option>
                  <option value="POSSESSION">Possession & Physical Takeover</option>
                  <option value="RR">Rehabilitation & Resettlement (R&R)</option>
                  <option value="CLOSED">Case Concluded</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Notification Date *
                </label>
                <input
                  type="date"
                  value={fields.stage_entry_date}
                  onChange={(e) => handleChange("stage_entry_date", e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Land Footprint (Hectares)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fields.land_area_ha}
                  onChange={(e) => handleChange("land_area_ha", e.target.value)}
                  placeholder="e.g. 45.5"
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Affected Families
                </label>
                <input
                  type="number"
                  value={fields.num_affected_families}
                  onChange={(e) => handleChange("num_affected_families", e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Verify & Confirm PDF Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
