"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

export interface ValidationErrorItem {
  row: number;
  field: string;
  error: string;
}

interface ValidationReportViewProps {
  totalRows: number;
  errors: ValidationErrorItem[];
  onConfirm: () => void;
  confirming?: boolean;
}

export const ValidationReportView: React.FC<ValidationReportViewProps> = ({
  totalRows,
  errors,
  onConfirm,
  confirming = false,
}) => {
  const hasErrors = errors.length > 0;
  const validCount = Math.max(0, totalRows - errors.length);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pre-Import Data Validation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict verification against RFCTLARR Act standards and schema types.
          </p>
        </div>

        {/* Severity Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {validCount} Valid
          </span>

          {hasErrors && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold border border-red-200 dark:border-red-800">
              <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              {errors.length} Errors
            </span>
          )}
        </div>
      </div>

      {hasErrors ? (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-800 dark:text-red-300">
            <p className="font-semibold">Import Blocked: Errors Detected</p>
            <p className="mt-0.5">
              Please fix the errors below in your file or adjust the column mapping before confirming import.
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50 dark:bg-slate-800/60">
            {errors.map((err, i) => (
              <div
                key={`err-${i}`}
                className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Row {err.row}:</strong> [{err.field}] {err.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">All Records Validated Successfully</p>
            <p className="mt-0.5 text-emerald-700 dark:text-emerald-300">
              {validCount} acquisition package record(s) are structured and ready for normalization into the project case repository and ML feature extraction.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Button */}
      <div className="pt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={onConfirm}
          disabled={hasErrors || confirming || totalRows === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {confirming ? (
            <span>Importing & Processing...</span>
          ) : (
            <>
              <span>Confirm & Ingest Records</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
