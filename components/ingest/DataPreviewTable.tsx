"use client";

import React from "react";
import { Table, Eye } from "lucide-react";

interface DataPreviewTableProps {
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  columns,
  rows,
  totalRows,
}) => {
  if (!columns || columns.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Uploaded Data Preview
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing first {Math.min(rows.length, 10)} of {totalRows} records
        </span>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <th className="py-2.5 px-3 font-semibold text-slate-500 dark:text-slate-400 w-12 text-center">
                  #
                </th>
                {columns.map((col, idx) => (
                  <th
                    key={`col-${idx}`}
                    className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rows.map((row, rIdx) => (
                <tr key={`row-${rIdx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-center text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    {rIdx + 1}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td
                      key={`cell-${rIdx}-${cIdx}`}
                      className="py-2 px-3 text-slate-800 dark:text-slate-200 whitespace-nowrap font-mono text-[11px]"
                    >
                      {row[col] !== undefined && row[col] !== null ? String(row[col]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
