"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

interface FileUploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFileSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = ["csv", "xlsx", "xls", "pdf"];
  const MAX_SIZE_MB = 15;

  const validateAndSelect = (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type (.${ext}). Only CSV, Excel (.xlsx, .xls), and PDF documents are supported.`);
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 15MB limit.`);
      return;
    }

    setSelectedFile(file);
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.005]"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Click to select or drag and drop acquisition data file
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports CSV, Microsoft Excel (.xlsx, .xls), and official Gazette notification PDFs (up to 15MB)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            <span>Required data:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Package ID, Notification Stage, Stage Entry Date</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && !error && (
        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedFile.name}</span>
            <span className="text-slate-500 dark:text-slate-400">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Ready for Processing
          </span>
        </div>
      )}
    </div>
  );
};
