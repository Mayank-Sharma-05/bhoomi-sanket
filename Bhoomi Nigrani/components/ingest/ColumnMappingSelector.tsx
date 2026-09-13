"use client";

import React from "react";
import { ArrowRight, Check, HelpCircle, Layers } from "lucide-react";

export interface SchemaTarget {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

interface ColumnMappingSelectorProps {
  targets: SchemaTarget[];
  uploadedColumns: string[];
  mapping: Record<string, string>; // uploadedCol -> schemaKey
  onMappingChange: (newMapping: Record<string, string>) => void;
}

export const ColumnMappingSelector: React.FC<ColumnMappingSelectorProps> = ({
  targets,
  uploadedColumns,
  mapping,
  onMappingChange,
}) => {
  // Invert mapping for display: schemaKey -> uploadedCol
  const targetToCol: Record<string, string> = {};
  Object.entries(mapping).forEach(([col, targetKey]) => {
    if (targetKey) {
      targetToCol[targetKey] = col;
    }
  });

  const handleSelect = (targetKey: string, selectedCol: string) => {
    const updated = { ...mapping };

    // Remove any previous column mapped to this target
    Object.keys(updated).forEach((col) => {
      if (updated[col] === targetKey) {
        delete updated[col];
      }
    });

    if (selectedCol) {
      updated[selectedCol] = targetKey;
    }

    onMappingChange(updated);
  };

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Column & Field Mapping
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Confirm or adjust how columns in your file correspond to Bhoomi Sanket land acquisition fields.
          </p>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
          {Object.keys(mapping).length} Columns Mapped
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {targets.map((target) => {
          const currentMappedCol = targetToCol[target.key] || "";
          const isMapped = !!currentMappedCol;

          return (
            <div
              key={target.key}
              className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                isMapped
                  ? "bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  : target.required
                  ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                  : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {target.label}
                  {target.required ? (
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-1.5 py-0.2 rounded">
                      Required
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      Optional
                    </span>
                  )}
                </span>
                {isMapped && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px] font-bold">
                    <Check className="w-3 h-3" /> Mapped
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <select
                  value={currentMappedCol}
                  onChange={(e) => handleSelect(target.key, e.target.value)}
                  className={`w-full py-1.5 px-2.5 rounded border text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
                    isMapped
                      ? "border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-200 bg-blue-50/50 dark:bg-blue-950/40 font-semibold"
                      : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <option value="">— Select Column from File —</option>
                  {uploadedColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
