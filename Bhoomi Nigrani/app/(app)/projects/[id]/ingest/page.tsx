"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  FolderKanban,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Cpu,
  ArrowRight,
  Database,
  RefreshCw,
} from "lucide-react";
import { FileUploadDropzone } from "@/components/ingest/FileUploadDropzone";
import { DataPreviewTable } from "@/components/ingest/DataPreviewTable";
import { ColumnMappingSelector, SchemaTarget } from "@/components/ingest/ColumnMappingSelector";
import { PdfVerificationPanel } from "@/components/ingest/PdfVerificationPanel";
import { ValidationReportView, ValidationErrorItem } from "@/components/ingest/ValidationReportView";

type IngestionStep = "UPLOAD" | "REVIEW" | "IMPORTED";

export default function ProjectDataIngestPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [step, setStep] = useState<IngestionStep>("UPLOAD");

  // Upload & Parsing State
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);

  // Column Mapping State (CSV/Excel)
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Validation & Import State
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/v1/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProject(data.data);
        }
      })
      .finally(() => setLoadingProject(false));
  }, [projectId]);

  // Handle File Selection & Trigger Parsing
  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`/api/v1/projects/${projectId}/ingest/parse`, {
        method: "POST",
        body: formData,
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        setParseError(resJson.error?.message || "Failed to parse document.");
        setParsing(false);
        return;
      }

      setParsedData(resJson.data);
      if (resJson.data.suggested_mapping) {
        setMapping(resJson.data.suggested_mapping);
      }

      setStep("REVIEW");
    } catch (err: unknown) {
      setParseError("Network error parsing file. Please try again.");
    } finally {
      setParsing(false);
    }
  };

  // Convert raw rows using mapping
  const buildMappedRecords = (): Record<string, any>[] => {
    if (!parsedData) return [];

    if (parsedData.file_type === "PDF") {
      return [parsedData.extracted_fields || {}];
    }

    const allRows = parsedData.all_rows || [];
    return allRows.map((rawRow: Record<string, any>) => {
      const normalized: Record<string, any> = {};
      Object.entries(mapping).forEach(([sourceCol, targetKey]) => {
        if (targetKey && rawRow[sourceCol] !== undefined) {
          normalized[targetKey] = rawRow[sourceCol];
        }
      });
      return normalized;
    });
  };

  // Run client-side preliminary validation
  useEffect(() => {
    if (step !== "REVIEW" || !parsedData) return;

    const errors: ValidationErrorItem[] = [];
    const targets: SchemaTarget[] = parsedData.schema_targets || [];
    const requiredTargets = targets.filter((t) => t.required);

    if (parsedData.file_type === "PDF") {
      const pdfFields = parsedData.extracted_fields || {};
      if (!pdfFields.case_number) {
        errors.push({ row: 1, field: "case_number", error: "Package ID is required." });
      }
      if (!pdfFields.current_stage) {
        errors.push({ row: 1, field: "current_stage", error: "Stage is required." });
      }
      setValidationErrors(errors);
      return;
    }

    // Check if required targets have mapped columns
    const mappedTargetKeys = new Set(Object.values(mapping));
    for (const req of requiredTargets) {
      if (!mappedTargetKeys.has(req.key)) {
        errors.push({
          row: 0,
          field: req.key,
          error: `Mandatory field "${req.label}" is not mapped to any column in the file.`,
        });
      }
    }

    // Check row-level values for first 50 rows
    const rows = parsedData.all_rows || [];
    rows.slice(0, 50).forEach((row: any, idx: number) => {
      // Find source column mapped to stage_entry_date
      const dateCol = Object.keys(mapping).find((col) => mapping[col] === "stage_entry_date");
      if (dateCol && row[dateCol]) {
        if (isNaN(Date.parse(String(row[dateCol])))) {
          errors.push({
            row: idx + 1,
            field: "stage_entry_date",
            error: `Invalid date "${row[dateCol]}".`,
          });
        }
      }
    });

    setValidationErrors(errors);
  }, [step, mapping, parsedData]);

  // Handle PDF Verified Form Confirmation
  const handlePdfConfirmed = (verifiedFields: Record<string, any>) => {
    setParsedData((prev: any) => ({
      ...prev,
      extracted_fields: verifiedFields,
    }));
    setValidationErrors([]);
  };

  // Confirm Import & Send to Ingest API
  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setConfirming(true);

    try {
      const recordsToImport = buildMappedRecords();

      const res = await fetch(`/api/v1/projects/${projectId}/ingest/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: parsedData.filename,
          file_type: parsedData.file_type,
          file_size_bytes: parsedData.file_size_bytes,
          records: recordsToImport,
        }),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        setParseError(resJson.error?.message || "Failed to complete data import.");
        setConfirming(false);
        return;
      }

      setImportResult(resJson.data);
      setStep("IMPORTED");
    } catch (err: unknown) {
      setParseError("Network error during import confirmation.");
    } finally {
      setConfirming(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
        Loading project ingestion context...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Project Not Found</p>
        <NextLink
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
        </NextLink>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <NextLink href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Projects
            </NextLink>
            <span>/</span>
            <NextLink href={`/projects/${project.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {project.project_name}
            </NextLink>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">Data Ingestion</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight">
            Upload Land Acquisition Data
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Ingest official CSV, Excel spreadsheets, or Gazette notification PDFs into project repository.
          </p>
        </div>

        <NextLink
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project</span>
        </NextLink>
      </div>

      {/* Ingestion Steps Progress Tracker */}
      <div className="grid grid-cols-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs text-xs font-semibold">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          step === "UPLOAD" ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800" : "text-slate-500 dark:text-slate-400"
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
            step === "UPLOAD" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}>
            1
          </div>
          <span>Upload File</span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          step === "REVIEW" ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800" : "text-slate-500 dark:text-slate-400"
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
            step === "REVIEW" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}>
            2
          </div>
          <span>Preview & Field Mapping</span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          step === "IMPORTED" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800" : "text-slate-500 dark:text-slate-400"
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
            step === "IMPORTED" ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}>
            3
          </div>
          <span>Import & ML Assessment</span>
        </div>
      </div>

      {parseError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Parsing / Processing Error</p>
            <p>{parseError}</p>
          </div>
        </div>
      )}

      {/* STEP 1: FILE UPLOAD */}
      {step === "UPLOAD" && (
        <div className="space-y-6">
          <FileUploadDropzone onFileSelected={handleFileSelected} disabled={parsing} />

          {parsing && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-xs text-slate-600 font-semibold shadow-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing and parsing document structure...</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PREVIEW, MAPPING & VALIDATION */}
      {step === "REVIEW" && parsedData && (
        <div className="space-y-6">
          {/* File Metadata Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-900">{parsedData.filename}</span>
              <span className="text-slate-500">
                ({parsedData.file_type} • {(parsedData.file_size_bytes / 1024).toFixed(1)} KB)
              </span>
            </div>

            <button
              onClick={() => {
                setStep("UPLOAD");
                setParsedData(null);
                setFile(null);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Choose different file
            </button>
          </div>

          {/* Conditional Display by File Type */}
          {parsedData.file_type === "PDF" ? (
            <PdfVerificationPanel
              filename={parsedData.filename}
              extractedSnippet={parsedData.extracted_text_snippet}
              initialFields={parsedData.extracted_fields || {}}
              reliable={parsedData.reliable}
              message={parsedData.message}
              onConfirmFields={handlePdfConfirmed}
            />
          ) : (
            <>
              {/* Data Preview Table */}
              <DataPreviewTable
                columns={parsedData.columns || []}
                rows={parsedData.preview_rows || []}
                totalRows={parsedData.total_rows || 0}
              />

              {/* Column Mapping Selector */}
              <ColumnMappingSelector
                targets={parsedData.schema_targets || []}
                uploadedColumns={parsedData.columns || []}
                mapping={mapping}
                onMappingChange={setMapping}
              />
            </>
          )}

          {/* Validation & Confirmation Section */}
          <ValidationReportView
            totalRows={parsedData.file_type === "PDF" ? 1 : parsedData.total_rows || 0}
            errors={validationErrors}
            onConfirm={handleConfirmImport}
            confirming={confirming}
          />
        </div>
      )}

      {/* STEP 3: CONFIRMED IMPORT & ML INGESTION RESULT */}
      {step === "IMPORTED" && importResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">
              Acquisition Data Ingestion Complete
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {importResult.records_imported} package record(s) normalized and saved to database repository.
            </p>
          </div>

          {/* Provenance and ML Assessment Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Database className="w-4 h-4 text-blue-600" />
                Data Provenance & Audit
              </div>
              <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                <div>Import ID: {importResult.import_id}</div>
                <div>Source: {parsedData?.filename}</div>
                <div>Format: {parsedData?.file_type}</div>
                <div>Audited: Immutable System Log Recorded</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Cpu className="w-4 h-4 text-indigo-600" />
                ML Inference Pipeline
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div>Features Generated: 22 attributes</div>
                <div>Status: <span className="font-semibold text-amber-700">Assessment Pending</span></div>
                <div className="text-[10px] text-slate-500">
                  ML Service in development stub mode. Separately trained model artifact required for live predictions.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <NextLink
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <span>View Project Packages & Status</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>

            <NextLink
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span>Go to Overview Dashboard</span>
            </NextLink>
          </div>
        </div>
      )}
    </div>
  );
}
