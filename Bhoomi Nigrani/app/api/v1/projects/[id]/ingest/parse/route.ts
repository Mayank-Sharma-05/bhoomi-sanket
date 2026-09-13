import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { mockStore } from "@/lib/data/mockStore";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const maxDuration = 60; // Allow sufficient time for larger files

const SCHEMA_TARGETS = [
  { key: "case_number", label: "Package / Case Identifier", required: true, aliases: ["case_id", "package", "pkg", "case_no", "case_number", "package_id", "pkg_no", "phase", "alignment", "section_code"] },
  { key: "case_title", label: "Package / Stretch Title", required: false, aliases: ["title", "name", "description", "case_title", "package_name", "stretch", "details"] },
  { key: "current_stage", label: "Acquisition Stage", required: true, aliases: ["current_stage", "stage", "status", "notification_stage", "larr_stage"] },
  { key: "stage_entry_date", label: "Stage Entry Date", required: true, aliases: ["snapshot_date", "entry_date", "notification_date", "stage_date", "start_date", "notified_on", "date"] },
  { key: "num_affected_families", label: "Affected Families Count", required: false, aliases: ["affected_families", "paf", "families", "displaced_families", "pafs"] },
  { key: "land_area_ha", label: "Land Extent (Hectares)", required: false, aliases: ["land_required_hectares", "area", "land_area", "hectares", "ha", "acres", "extent"] },
  { key: "clear_title_percent", label: "Clear Title Share (%)", required: false, aliases: ["clear_title", "title_clear", "clear_percent", "undisputed"] },
  { key: "court_stay_active", label: "Court Stay Active (Yes/No)", required: false, aliases: ["stay", "court_stay", "stay_active", "stay_order", "is_stayed"] },
  { key: "legal_cases_pending", label: "Pending Court Disputes", required: false, aliases: ["legal_cases_pending", "active_legal_cases", "legal_cases", "disputes", "court_cases", "cases_pending", "litigations"] },
  { key: "comp_awarded_crore", label: "Awarded Compensation (₹ Cr)", required: false, aliases: ["compensation_approved_amount", "comp_awarded", "awarded_crore", "award_amount", "award_crore"] },
  { key: "comp_disbursed_crore", label: "Disbursed Compensation (₹ Cr)", required: false, aliases: ["compensation_paid_amount", "comp_disbursed", "disbursed_crore", "paid_compensation", "disbursed"] },
  { key: "comp_disputes_pending", label: "Pending Compensation Disputes", required: false, aliases: ["compensation_pending_amount", "comp_disputes", "disputed_awards", "compensation_disputes"] },
  { key: "rr_plan_approved", label: "R&R Plan Approved (Yes/No)", required: false, aliases: ["rr_required", "rr_approved", "rr_plan", "resettlement_approved"] },
  { key: "families_resettled", label: "Families Resettled", required: false, aliases: ["rr_completed_families", "resettled", "resettled_families", "rehabilitated"] },
  { key: "forest_land_involved", label: "Forest Land Involved (Yes/No)", required: false, aliases: ["forest", "forest_land", "forest_clearance"] },
  { key: "tribal_area", label: "Tribal Area (Yes/No)", required: false, aliases: ["tribal", "scheduled_area", "tribal_land"] },
  { key: "stakeholder_meetings_count", label: "Stakeholder Meetings Count", required: false, aliases: ["departments_involved", "meetings", "gram_sabha", "stakeholder_consultations"] },
];

function suggestMapping(uploadedColumns: string[]) {
  const mapping: Record<string, string> = {};
  const claimedTargets = new Set<string>();

  // Pass 1: Exact match on target key (e.g. current_stage === current_stage)
  for (const col of uploadedColumns) {
    const cleanCol = col.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    const target = SCHEMA_TARGETS.find((t) => cleanCol === t.key.toLowerCase());
    if (target && !claimedTargets.has(target.key)) {
      mapping[col] = target.key;
      claimedTargets.add(target.key);
    }
  }

  // Pass 2: Exact match on an alias (e.g. case_id in aliases of case_number)
  for (const col of uploadedColumns) {
    if (mapping[col]) continue;
    const cleanCol = col.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    const target = SCHEMA_TARGETS.find(
      (t) => !claimedTargets.has(t.key) && t.aliases.some((alias) => cleanCol === alias.toLowerCase())
    );
    if (target) {
      mapping[col] = target.key;
      claimedTargets.add(target.key);
    }
  }

  // Pass 3: Token-based match for compound tokens without collisions
  for (const col of uploadedColumns) {
    if (mapping[col]) continue;
    const cleanCol = col.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    const tokens = cleanCol.split("_").filter(Boolean);
    const target = SCHEMA_TARGETS.find(
      (t) =>
        !claimedTargets.has(t.key) &&
        t.aliases.some((alias) => {
          const aliasTokens = alias.toLowerCase().split("_");
          return aliasTokens.length > 1 && aliasTokens.every((at) => tokens.includes(at));
        })
    );
    if (target) {
      mapping[col] = target.key;
      claimedTargets.add(target.key);
    }
  }

  return mapping;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const projectId = decodeURIComponent(resolvedParams?.id || "").trim();

    const project = await mockStore.getProjectByIdAsync(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found." } },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "No file uploaded." } },
        { status: 400 }
      );
    }

    // Size limit check (15 MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: `File size exceeds the 15MB limit. Uploaded: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
          },
        },
        { status: 400 }
      );
    }

    const filename = file.name;
    const fileExt = filename.split(".").pop()?.toLowerCase() || "";
    const buffer = Buffer.from(await file.arrayBuffer());

    // Persist raw uploaded file to .data/uploads for audit & record retention
    try {
      const uploadDir = path.join(process.cwd(), ".data", "uploads", project.id);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, `${Date.now()}_${filename}`), buffer);
    } catch (saveErr) {
      console.warn("Failed to persist uploaded raw file to disk:", saveErr);
    }

    // 1. CSV Handler
    if (fileExt === "csv") {
      const csvText = buffer.toString("utf-8");
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PARSE_ERROR",
              message: `CSV parsing failed: ${parsed.errors[0]?.message || "Invalid structure"}`,
            },
          },
          { status: 400 }
        );
      }

      const columns = parsed.meta.fields || [];
      const totalRows = parsed.data.length;
      const previewRows = parsed.data.slice(0, 10);
      const suggestedMapping = suggestMapping(columns);

      return NextResponse.json({
        success: true,
        data: {
          file_type: "CSV",
          filename,
          file_size_bytes: file.size,
          columns,
          total_rows: totalRows,
          preview_rows: previewRows,
          all_rows: parsed.data,
          suggested_mapping: suggestedMapping,
          schema_targets: SCHEMA_TARGETS,
        },
      });
    }

    // 2. Excel (XLSX / XLS) Handler
    if (fileExt === "xlsx" || fileExt === "xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return NextResponse.json(
          { success: false, error: { code: "EMPTY_WORKBOOK", message: "Excel workbook has no sheets." } },
          { status: 400 }
        );
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        raw: false,
        defval: "",
      });

      if (rawJson.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "EMPTY_SHEET", message: "Selected worksheet is empty." } },
          { status: 400 }
        );
      }

      const columns = Object.keys(rawJson[0]);
      const totalRows = rawJson.length;
      const previewRows = rawJson.slice(0, 10);
      const suggestedMapping = suggestMapping(columns);

      return NextResponse.json({
        success: true,
        data: {
          file_type: fileExt.toUpperCase(),
          filename,
          sheet_name: sheetName,
          sheets: workbook.SheetNames,
          file_size_bytes: file.size,
          columns,
          total_rows: totalRows,
          preview_rows: previewRows,
          all_rows: rawJson,
          suggested_mapping: suggestedMapping,
          schema_targets: SCHEMA_TARGETS,
        },
      });
    }

    // 3. PDF Handler
    if (fileExt === "pdf") {
      let text = "";
      let numPages = 1;

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfPkg = require("pdf-parse");
        const PDFParseClass = pdfPkg.PDFParse || pdfPkg;

        if (typeof PDFParseClass === "function" && PDFParseClass.prototype?.getText) {
          const parser = new PDFParseClass({ data: buffer });
          try {
            const result = await parser.getText();
            if (result?.pages && Array.isArray(result.pages)) {
              numPages = result.total || result.pages.length || 1;
              text = result.pages.map((p: any) => p.text || "").join("\n");
            } else if (typeof result?.text === "string") {
              text = result.text;
              numPages = result.total || 1;
            }
          } finally {
            if (typeof parser.destroy === "function") {
              await parser.destroy().catch(() => {});
            }
          }
        } else if (typeof pdfPkg === "function") {
          const pdfData = await pdfPkg(buffer);
          text = pdfData.text || "";
          numPages = pdfData.numpages || 1;
        }
      } catch (pdfErr) {
        console.warn("PDF stream parsing warning:", pdfErr);
        text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ");
      }

      // Gazette & Notification Landmark Extractors
      const extractedFields: Record<string, any> = {};
      let reliable = false;

      // Detect Stage Landmark
      if (/Section\s*4\s*(\(1\))?|Social\s*Impact\s*Assessment/i.test(text)) {
        extractedFields.current_stage = "SIA";
        reliable = true;
      } else if (/Section\s*11\s*(\(1\))?|Preliminary\s*Notification/i.test(text)) {
        extractedFields.current_stage = "SECTION_11";
        reliable = true;
      } else if (/Section\s*19\s*(\(1\))?|Declaration/i.test(text)) {
        extractedFields.current_stage = "SECTION_19";
        reliable = true;
      } else if (/Section\s*23|Section\s*27|Award\s*Enquiry/i.test(text)) {
        extractedFields.current_stage = "AWARD";
        reliable = true;
      } else if (/Section\s*38|Possession/i.test(text)) {
        extractedFields.current_stage = "POSSESSION";
        reliable = true;
      }

      // Detect Case Number / Gazette Reference
      const caseMatch = text.match(/(Notification\s*No\.?|Gazette\s*Ref\.?|File\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9\/\-_]+)/i);
      if (caseMatch) {
        extractedFields.case_number = caseMatch[2]?.slice(0, 30);
      } else {
        extractedFields.case_number = "GAZETTE-PKG-01";
      }

      // Detect Date pattern (e.g. 12/04/2023 or 2023-04-12)
      const dateMatch = text.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})|(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/);
      if (dateMatch) {
        const rawDate = dateMatch[0];
        extractedFields.stage_entry_date = rawDate.replace(/\//g, "-");
      }

      // Detect Land Extent
      const areaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ha|hectares|hectare|acres)/i);
      if (areaMatch) {
        extractedFields.land_area_ha = parseFloat(areaMatch[1]);
        reliable = true;
      }

      // Detect Affected Families
      const familyMatch = text.match(/(\d+)\s*(?:affected\s*families|pafs|families|displaced\s*persons)/i);
      if (familyMatch) {
        extractedFields.num_affected_families = parseInt(familyMatch[1], 10);
      }

      // Extract a snippet for officer visual verification
      const cleanSnippet = text
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 800);

      return NextResponse.json({
        success: true,
        data: {
          file_type: "PDF",
          filename,
          file_size_bytes: file.size,
          pages: numPages,
          extracted_text_snippet: cleanSnippet,
          extracted_fields: extractedFields,
          reliable,
          message: reliable
            ? "Gazette notification patterns detected. Please verify extracted fields."
            : "Unable to reliably extract structured data from this document. Please verify the extracted information or upload a CSV/XLSX file.",
          schema_targets: SCHEMA_TARGETS,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNSUPPORTED_TYPE",
          message: `Unsupported file format (.${fileExt}). Please upload .csv, .xlsx, .xls, or .pdf files.`,
        },
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error parsing file";
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 }
    );
  }
}
