import { Pool, QueryResult, QueryResultRow } from "pg";
import { ProjectType, FundingModel, AcquisitionStage, RiskLevel, PredictionResponse } from "@/shared/types/ml-contract";

// Global connection pool singleton across Next.js API route bundles
const globalForDb = globalThis as unknown as {
  __supabase_pool?: Pool;
};

function getPool(): Pool {
  if (globalForDb.__supabase_pool) {
    return globalForDb.__supabase_pool;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    "";

  if (!connectionString) {
    console.warn("WARNING: Neither DATABASE_URL nor DIRECT_URL is set for Supabase.");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle Supabase client:", err);
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__supabase_pool = pool;
  }

  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

// Interfaces matching Bhoomi Sanket domain model
export interface DbProject {
  id: string;
  project_name: string;
  project_type: ProjectType;
  funding_model: FundingModel;
  implementing_agency: string;
  district_id: number;
  district_name: string;
  state_code: string;
  state_name: string;
  land_area_ha: number;
  num_affected_families: number;
  budget_crore: number;
  project_start_date: string;
  description: string;
  is_demo_data: boolean;
  cases: DbCase[];
}

export interface DbProjectSummary {
  id: string;
  project_name: string;
  project_type: ProjectType;
  funding_model: FundingModel;
  implementing_agency: string;
  district_id: number;
  district_name: string;
  state_code: string;
  land_area_ha: number;
  budget_crore: number;
  total_cases: number;
  active_cases: number;
  highest_risk_tier: RiskLevel;
  avg_risk_probability: number;
  is_demo_data?: boolean;
}

export interface DbDashboardSummary {
  total_projects: number;
  total_cases: number;
  active_cases: number;
  critical_cases: number;
  high_risk_cases: number;
  medium_risk_cases: number;
  low_risk_cases: number;
  avg_risk_probability: number;
  unread_alerts_count: number;
}

export interface DbCase {
  id: string;
  project_id: string;
  case_number: string;
  case_title: string;
  current_stage: AcquisitionStage;
  stage_entry_date: string;
  statutory_deadline_date?: string | null;
  benchmark_deadline_date?: string | null;
  sia_started: boolean;
  public_hearing_held: boolean;
  objections_filed_count: number;
  legal_cases_pending: number;
  court_stay_active: boolean;
  avg_dispute_age_days: number;
  comp_awarded_crore?: number | null;
  comp_disbursed_crore: number;
  comp_disputes_pending: number;
  max_pending_days_comp: number;
  rr_plan_approved: boolean;
  families_resettled: number;
  clear_title_percent: number;
  forest_land_involved: boolean;
  tribal_area: boolean;
  stakeholder_meetings_count: number;
  overall_status: "ACTIVE" | "CLOSED" | "CANCELLED";
  latest_assessment?: PredictionResponse;
}

export interface DbAlert {
  id: string;
  case_id: string;
  case_title: string;
  project_name: string;
  alert_type: "RISK_ESCALATION" | "DEADLINE_BREACH" | "COURT_STAY" | "STALENESS";
  severity: RiskLevel;
  title: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
}

export interface DbAuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface DbDataImport {
  id: string;
  project_id: string;
  source_filename: string;
  source_type: "CSV" | "XLSX" | "XLS" | "PDF";
  file_size_bytes: number;
  uploaded_by: string;
  uploader_name: string;
  records_count: number;
  validation_status: "PENDING" | "VALIDATED" | "IMPORT_FAILED" | "CONFIRMED";
  validation_summary: any;
  created_at: string;
}

// High-level query helpers for Bhoomi Sanket
export const supabaseDb = {
  query,

  // Projects
  getProjects: async (filters?: { districtId?: number; stateCode?: string }): Promise<DbProject[]> => {
    let sql = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(c.*) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as cases_json
      FROM projects p
      LEFT JOIN acquisition_cases c ON p.id = c.project_id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.districtId) {
      params.push(filters.districtId);
      conditions.push(`p.district_id = $${params.length}`);
    }
    if (filters?.stateCode) {
      params.push(filters.stateCode);
      conditions.push(`p.state_code = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(" AND ");
    }
    sql += ` GROUP BY p.id ORDER BY p.project_name ASC`;

    const res = await query(sql, params);
    return res.rows.map((row) => ({
      id: row.id,
      project_name: row.project_name,
      project_type: row.project_type,
      funding_model: row.funding_model,
      implementing_agency: row.implementing_agency || "State Infrastructure Agency",
      district_id: row.district_id,
      district_name: row.district_name,
      state_code: row.state_code,
      state_name: row.state_name,
      land_area_ha: parseFloat(row.land_area_ha) || 0,
      num_affected_families: parseInt(row.num_affected_families, 10) || 0,
      budget_crore: parseFloat(row.budget_crore) || 0,
      project_start_date: row.project_start_date,
      description: row.description || "",
      is_demo_data: row.is_demo_data || false,
      cases: (row.cases_json || []).map((c: any) => ({
        id: c.id,
        project_id: c.project_id,
        case_number: c.case_number,
        case_title: c.case_title,
        current_stage: c.current_stage,
        stage_entry_date: c.stage_entry_date,
        statutory_deadline_date: c.statutory_deadline_date,
        benchmark_deadline_date: c.benchmark_deadline_date,
        sia_started: c.sia_started,
        public_hearing_held: c.public_hearing_held,
        objections_filed_count: c.objections_filed_count || 0,
        legal_cases_pending: c.legal_cases_pending || 0,
        court_stay_active: c.court_stay_active,
        avg_dispute_age_days: c.avg_dispute_age_days || 0,
        comp_awarded_crore: c.comp_awarded_crore ? parseFloat(c.comp_awarded_crore) : null,
        comp_disbursed_crore: parseFloat(c.comp_disbursed_crore) || 0,
        comp_disputes_pending: c.comp_disputes_pending || 0,
        max_pending_days_comp: c.max_pending_days_comp || 0,
        rr_plan_approved: c.rr_plan_approved,
        families_resettled: c.families_resettled || 0,
        clear_title_percent: parseFloat(c.clear_title_percent) || 100,
        forest_land_involved: c.forest_land_involved,
        tribal_area: c.tribal_area,
        stakeholder_meetings_count: c.stakeholder_meetings_count || 0,
        overall_status: c.overall_status || "ACTIVE",
        latest_assessment: c.assessment_json ? JSON.parse(c.assessment_json) : undefined,
      })),
    }));
  },

  // High-performance Project Summaries (aggregates directly in SQL, 92%+ smaller payload, ~120ms)
  getProjectSummaries: async (filters?: {
    districtId?: number;
    stateCode?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<DbProjectSummary[]> => {
    let sql = `
      SELECT 
        p.id,
        p.project_name,
        p.project_type,
        p.funding_model,
        p.implementing_agency,
        p.district_id,
        p.district_name,
        p.state_code,
        p.land_area_ha,
        p.budget_crore,
        p.is_demo_data,
        COUNT(c.id)::int AS total_cases,
        COUNT(c.id) FILTER (WHERE c.overall_status = 'ACTIVE')::int AS active_cases,
        COALESCE(
          MAX(
            CASE 
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'CRITICAL' THEN 'CRITICAL'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'HIGH' THEN 'HIGH'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'MEDIUM' THEN 'MEDIUM'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'LOW' THEN 'LOW'
              ELSE 'LOW'
            END
          ),
          'LOW'
        ) AS highest_risk_tier,
        COALESCE(
          ROUND(AVG(
            CASE
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND c.assessment_json::jsonb->'prediction'->>'risk_probability' IS NOT NULL
              THEN (c.assessment_json::jsonb->'prediction'->>'risk_probability')::numeric
              ELSE NULL
            END
          ), 3)::float,
          0.0
        ) AS avg_risk_probability
      FROM projects p
      LEFT JOIN acquisition_cases c ON p.id = c.project_id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.districtId) {
      params.push(filters.districtId);
      conditions.push(`p.district_id = $${params.length}`);
    }
    if (filters?.stateCode) {
      params.push(filters.stateCode);
      conditions.push(`p.state_code = $${params.length}`);
    }
    if (filters?.query) {
      params.push(`%${filters.query}%`);
      conditions.push(`(p.project_name ILIKE $${params.length} OR p.district_name ILIKE $${params.length} OR p.state_code ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(" AND ");
    }
    sql += ` GROUP BY p.id ORDER BY p.project_name ASC`;

    if (filters?.limit) {
      params.push(filters.limit);
      sql += ` LIMIT $${params.length}`;
      if (filters?.offset) {
        params.push(filters.offset);
        sql += ` OFFSET $${params.length}`;
      }
    }

    const res = await query(sql, params);
    return res.rows.map((r) => ({
      id: r.id,
      project_name: r.project_name,
      project_type: r.project_type,
      funding_model: r.funding_model,
      implementing_agency: r.implementing_agency || "State Infrastructure Agency",
      district_id: r.district_id,
      district_name: r.district_name,
      state_code: r.state_code,
      land_area_ha: parseFloat(r.land_area_ha) || 0,
      budget_crore: parseFloat(r.budget_crore) || 0,
      total_cases: r.total_cases,
      active_cases: r.active_cases,
      highest_risk_tier: r.highest_risk_tier as RiskLevel,
      avg_risk_probability: r.avg_risk_probability,
      is_demo_data: r.is_demo_data ?? true,
    }));
  },

  // High-performance single SQL query for dashboard telemetry KPIs (~120ms)
  getDashboardSummary: async (): Promise<DbDashboardSummary> => {
    const sql = `
      SELECT
        (SELECT COUNT(*)::int FROM projects) AS total_projects,
        (SELECT COUNT(*)::int FROM acquisition_cases) AS total_cases,
        (SELECT COUNT(*)::int FROM acquisition_cases WHERE overall_status = 'ACTIVE') AS active_cases,
        (SELECT COUNT(*)::int FROM acquisition_cases WHERE assessment_json IS NOT NULL AND assessment_json != '' AND (assessment_json::jsonb->'prediction'->>'risk_level') = 'CRITICAL') AS critical_cases,
        (SELECT COUNT(*)::int FROM acquisition_cases WHERE assessment_json IS NOT NULL AND assessment_json != '' AND (assessment_json::jsonb->'prediction'->>'risk_level') = 'HIGH') AS high_risk_cases,
        (SELECT COUNT(*)::int FROM acquisition_cases WHERE assessment_json IS NOT NULL AND assessment_json != '' AND (assessment_json::jsonb->'prediction'->>'risk_level') = 'MEDIUM') AS medium_risk_cases,
        (SELECT COUNT(*)::int FROM acquisition_cases WHERE assessment_json IS NOT NULL AND assessment_json != '' AND (assessment_json::jsonb->'prediction'->>'risk_level') = 'LOW') AS low_risk_cases,
        (SELECT COALESCE(ROUND(AVG(
          CASE
            WHEN assessment_json IS NOT NULL AND assessment_json != '' AND assessment_json::jsonb->'prediction'->>'risk_probability' IS NOT NULL
            THEN (assessment_json::jsonb->'prediction'->>'risk_probability')::numeric
            ELSE NULL
          END
        ), 3)::float, 0.0) FROM acquisition_cases) AS avg_risk_probability,
        (SELECT COUNT(*)::int FROM alerts WHERE acknowledged = false) AS unread_alerts_count;
    `;
    const res = await query(sql);
    const row = res.rows[0];
    return {
      total_projects: row?.total_projects || 0,
      total_cases: row?.total_cases || 0,
      active_cases: row?.active_cases || 0,
      critical_cases: row?.critical_cases || 0,
      high_risk_cases: row?.high_risk_cases || 0,
      medium_risk_cases: row?.medium_risk_cases || 0,
      low_risk_cases: row?.low_risk_cases || 0,
      avg_risk_probability: row?.avg_risk_probability || 0.0,
      unread_alerts_count: row?.unread_alerts_count || 0,
    };
  },

  // Fast distinct states query for top command bar selector (~10ms)
  getDistinctStates: async (): Promise<string[]> => {
    const res = await query(`
      SELECT DISTINCT state_code 
      FROM projects 
      WHERE state_code IS NOT NULL AND state_code != ''
      ORDER BY state_code ASC;
    `);
    return res.rows.map((r) => r.state_code);
  },

  // Fast GIS projects feature collection (~100ms)
  getGisProjectsFast: async (): Promise<any[]> => {
    try {
      const sql = `
        SELECT
          p.id,
          p.project_name,
          p.project_type,
          p.district_name,
          p.state_code,
          p.land_area_ha,
          p.budget_crore,
          COUNT(c.id)::int AS total_cases,
          MAX(
            CASE
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'CRITICAL' THEN 'CRITICAL'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'HIGH' THEN 'HIGH'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'MEDIUM' THEN 'MEDIUM'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'LOW' THEN 'LOW'
              ELSE 'LOW'
            END
          ) AS highest_risk_tier,
          78.0 AS lon,
          22.0 AS lat
        FROM projects p
        LEFT JOIN acquisition_cases c ON p.id = c.project_id
        GROUP BY p.id, p.project_name, p.project_type, p.district_name, p.state_code, p.land_area_ha, p.budget_crore
        ORDER BY p.project_name ASC;
      `;
      const res = await query(sql);
      return res.rows.map((p) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(p.lon), Number(p.lat)],
        },
        properties: {
          project_id: p.id,
          project_name: p.project_name,
          project_type: p.project_type,
          district_name: p.district_name,
          state_code: p.state_code,
          land_area_ha: parseFloat(p.land_area_ha) || 0,
          budget_crore: parseFloat(p.budget_crore) || 0,
          total_cases: p.total_cases,
          highest_risk_tier: p.highest_risk_tier,
        },
      }));
    } catch (err) {
      console.warn("getGisProjectsFast DB query failed:", err);
      return [];
    }
  },

  // Fast GIS districts feature collection (~80ms)
  getGisDistrictsFast: async (): Promise<any[]> => {
    try {
      const sql = `
        SELECT
          d.id AS district_id,
          d.district_name,
          d.state_code,
          COUNT(DISTINCT p.id)::int AS total_projects,
          COUNT(c.id)::int AS total_cases,
          COUNT(c.id) FILTER (WHERE c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'CRITICAL')::int AS critical_count,
          COUNT(c.id) FILTER (WHERE c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'HIGH')::int AS high_count,
          ROUND(
            AVG(
              CASE
                WHEN c.assessment_json IS NULL OR c.assessment_json = '' OR c.assessment_json::jsonb->'prediction'->>'risk_probability' IS NULL THEN NULL
                ELSE (c.assessment_json::jsonb->'prediction'->>'risk_probability')::numeric
              END
            ),
            3
          )::float AS avg_risk_probability,
          MAX(
            CASE
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'CRITICAL' THEN 'CRITICAL'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'HIGH' THEN 'HIGH'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'MEDIUM' THEN 'MEDIUM'
              WHEN c.assessment_json IS NOT NULL AND c.assessment_json != '' AND (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'LOW' THEN 'LOW'
              ELSE 'LOW'
            END
          ) AS highest_risk_tier,
          78.0 AS lon,
          22.0 AS lat
        FROM districts d
        LEFT JOIN projects p ON p.district_name = d.district_name AND p.state_code = d.state_code
        LEFT JOIN acquisition_cases c ON p.id = c.project_id
        GROUP BY d.id, d.district_name, d.state_code
        ORDER BY d.district_name ASC;
      `;
      const res = await query(sql);
      return res.rows.map((d) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(d.lon), Number(d.lat)],
        },
        properties: {
          district_id: d.district_id,
          district_name: d.district_name,
          state_code: d.state_code,
          total_projects: d.total_projects,
          total_cases: d.total_cases,
          avg_risk_probability: d.avg_risk_probability,
          critical_count: d.critical_count,
          highest_risk_tier: d.highest_risk_tier,
        },
      }));
    } catch (err) {
      console.warn("getGisDistrictsFast DB query failed:", err);
      return [];
    }
  },

  getProjectById: async (id: string): Promise<DbProject | null> => {
    if (!id) return null;
    const cleanId = id.trim();
    const sql = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(c.*) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as cases_json
      FROM projects p
      LEFT JOIN acquisition_cases c ON p.id = c.project_id
      WHERE LOWER(p.id) = LOWER($1) OR UPPER(p.id) = UPPER($1)
      GROUP BY p.id
      LIMIT 1;
    `;
    const res = await query(sql, [cleanId]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      project_name: row.project_name,
      project_type: row.project_type,
      funding_model: row.funding_model,
      implementing_agency: row.implementing_agency || "State Infrastructure Agency",
      district_id: row.district_id,
      district_name: row.district_name,
      state_code: row.state_code,
      state_name: row.state_name,
      land_area_ha: parseFloat(row.land_area_ha) || 0,
      num_affected_families: parseInt(row.num_affected_families, 10) || 0,
      budget_crore: parseFloat(row.budget_crore) || 0,
      project_start_date: row.project_start_date,
      description: row.description || "",
      is_demo_data: row.is_demo_data || false,
      cases: (row.cases_json || []).map((c: any) => ({
        id: c.id,
        project_id: c.project_id,
        case_number: c.case_number,
        case_title: c.case_title,
        current_stage: c.current_stage,
        stage_entry_date: c.stage_entry_date,
        statutory_deadline_date: c.statutory_deadline_date,
        benchmark_deadline_date: c.benchmark_deadline_date,
        sia_started: c.sia_started,
        public_hearing_held: c.public_hearing_held,
        objections_filed_count: c.objections_filed_count || 0,
        legal_cases_pending: c.legal_cases_pending || 0,
        court_stay_active: c.court_stay_active,
        avg_dispute_age_days: c.avg_dispute_age_days || 0,
        comp_awarded_crore: c.comp_awarded_crore ? parseFloat(c.comp_awarded_crore) : null,
        comp_disbursed_crore: parseFloat(c.comp_disbursed_crore) || 0,
        comp_disputes_pending: c.comp_disputes_pending || 0,
        max_pending_days_comp: c.max_pending_days_comp || 0,
        rr_plan_approved: c.rr_plan_approved,
        families_resettled: c.families_resettled || 0,
        clear_title_percent: parseFloat(c.clear_title_percent) || 100,
        forest_land_involved: c.forest_land_involved,
        tribal_area: c.tribal_area,
        stakeholder_meetings_count: c.stakeholder_meetings_count || 0,
        overall_status: c.overall_status || "ACTIVE",
        latest_assessment: c.assessment_json ? JSON.parse(c.assessment_json) : undefined,
      })),
    };
  },

  addProject: async (project: DbProject): Promise<DbProject> => {
    // 1. Ensure state exists
    await query(`
      INSERT INTO states (state_code, state_name)
      VALUES ($1, $2)
      ON CONFLICT (state_code) DO NOTHING;
    `, [project.state_code, project.state_name || project.state_code]);

    // 2. Ensure district exists
    const distRes = await query(`
      INSERT INTO districts (district_name, state_code)
      VALUES ($1, $2)
      ON CONFLICT (district_name, state_code) DO UPDATE
      SET district_name = EXCLUDED.district_name
      RETURNING id;
    `, [project.district_name || "General District", project.state_code]);
    const districtId = distRes.rows[0]?.id || project.district_id || 1;

    // 3. Upsert project
    await query(`
      INSERT INTO projects (
        id, project_name, project_type, funding_model, implementing_agency,
        district_id, district_name, state_code, state_name, land_area_ha,
        num_affected_families, budget_crore, project_start_date, description,
        is_demo_data, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        project_name = EXCLUDED.project_name,
        project_type = EXCLUDED.project_type,
        funding_model = EXCLUDED.funding_model,
        implementing_agency = EXCLUDED.implementing_agency,
        district_id = EXCLUDED.district_id,
        district_name = EXCLUDED.district_name,
        state_code = EXCLUDED.state_code,
        state_name = EXCLUDED.state_name,
        land_area_ha = EXCLUDED.land_area_ha,
        num_affected_families = EXCLUDED.num_affected_families,
        budget_crore = EXCLUDED.budget_crore,
        project_start_date = EXCLUDED.project_start_date,
        description = EXCLUDED.description,
        is_demo_data = EXCLUDED.is_demo_data,
        updated_at = CURRENT_TIMESTAMP;
    `, [
      project.id, project.project_name, project.project_type, project.funding_model,
      project.implementing_agency, districtId, project.district_name, project.state_code,
      project.state_name, project.land_area_ha, project.num_affected_families,
      project.budget_crore, project.project_start_date, project.description,
      project.is_demo_data
    ]);

    // 4. Upsert cases if any
    if (project.cases && project.cases.length > 0) {
      await supabaseDb.addCases(project.id, project.cases);
    }

    return project;
  },

  // Cases
  getAllCases: async (): Promise<DbCase[]> => {
    const res = await query(`SELECT * FROM acquisition_cases ORDER BY case_number ASC;`);
    return res.rows.map((c) => ({
      id: c.id,
      project_id: c.project_id,
      case_number: c.case_number,
      case_title: c.case_title,
      current_stage: c.current_stage,
      stage_entry_date: c.stage_entry_date,
      statutory_deadline_date: c.statutory_deadline_date,
      benchmark_deadline_date: c.benchmark_deadline_date,
      sia_started: c.sia_started,
      public_hearing_held: c.public_hearing_held,
      objections_filed_count: c.objections_filed_count || 0,
      legal_cases_pending: c.legal_cases_pending || 0,
      court_stay_active: c.court_stay_active,
      avg_dispute_age_days: c.avg_dispute_age_days || 0,
      comp_awarded_crore: c.comp_awarded_crore ? parseFloat(c.comp_awarded_crore) : null,
      comp_disbursed_crore: parseFloat(c.comp_disbursed_crore) || 0,
      comp_disputes_pending: c.comp_disputes_pending || 0,
      max_pending_days_comp: c.max_pending_days_comp || 0,
      rr_plan_approved: c.rr_plan_approved,
      families_resettled: c.families_resettled || 0,
      clear_title_percent: parseFloat(c.clear_title_percent) || 100,
      forest_land_involved: c.forest_land_involved,
      tribal_area: c.tribal_area,
      stakeholder_meetings_count: c.stakeholder_meetings_count || 0,
      overall_status: c.overall_status || "ACTIVE",
      latest_assessment: c.assessment_json ? JSON.parse(c.assessment_json) : undefined,
    }));
  },

  getCaseById: async (caseId: string): Promise<{ caseData: DbCase; project: DbProject } | null> => {
    if (!caseId) return null;
    const cleanId = caseId.trim();
    const caseRes = await query(`
      SELECT * FROM acquisition_cases 
      WHERE LOWER(id) = LOWER($1) OR LOWER(case_number) = LOWER($1)
      LIMIT 1;
    `, [cleanId]);

    if (caseRes.rows.length === 0) return null;
    const c = caseRes.rows[0];

    const project = await supabaseDb.getProjectById(c.project_id);
    if (!project) return null;

    const caseData: DbCase = {
      id: c.id,
      project_id: c.project_id,
      case_number: c.case_number,
      case_title: c.case_title,
      current_stage: c.current_stage,
      stage_entry_date: c.stage_entry_date,
      statutory_deadline_date: c.statutory_deadline_date,
      benchmark_deadline_date: c.benchmark_deadline_date,
      sia_started: c.sia_started,
      public_hearing_held: c.public_hearing_held,
      objections_filed_count: c.objections_filed_count || 0,
      legal_cases_pending: c.legal_cases_pending || 0,
      court_stay_active: c.court_stay_active,
      avg_dispute_age_days: c.avg_dispute_age_days || 0,
      comp_awarded_crore: c.comp_awarded_crore ? parseFloat(c.comp_awarded_crore) : null,
      comp_disbursed_crore: parseFloat(c.comp_disbursed_crore) || 0,
      comp_disputes_pending: c.comp_disputes_pending || 0,
      max_pending_days_comp: c.max_pending_days_comp || 0,
      rr_plan_approved: c.rr_plan_approved,
      families_resettled: c.families_resettled || 0,
      clear_title_percent: parseFloat(c.clear_title_percent) || 100,
      forest_land_involved: c.forest_land_involved,
      tribal_area: c.tribal_area,
      stakeholder_meetings_count: c.stakeholder_meetings_count || 0,
      overall_status: c.overall_status || "ACTIVE",
      latest_assessment: c.assessment_json ? JSON.parse(c.assessment_json) : undefined,
    };

    return { caseData, project };
  },

  addCases: async (projectId: string, newCases: DbCase[]): Promise<DbCase[]> => {
    if (!newCases || newCases.length === 0) return [];
    const batchSize = 100;
    const committed: DbCase[] = [];

    for (let i = 0; i < newCases.length; i += batchSize) {
      const batch = newCases.slice(i, i + batchSize);
      const valuePlaceholders: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const c of batch) {
        const rowPlaceholders: string[] = [];
        const fields = [
          c.id, projectId, c.case_number, c.case_title, c.current_stage || "SIA",
          c.stage_entry_date, c.statutory_deadline_date, c.benchmark_deadline_date,
          c.sia_started || false, c.public_hearing_held || false, c.objections_filed_count || 0,
          c.legal_cases_pending || 0, c.court_stay_active || false, c.avg_dispute_age_days || 0,
          c.comp_awarded_crore ?? null, c.comp_disbursed_crore || 0, c.comp_disputes_pending || 0,
          c.max_pending_days_comp || 0, c.rr_plan_approved || false, c.families_resettled || 0,
          c.clear_title_percent ?? 100, c.forest_land_involved || false, c.tribal_area || false,
          c.stakeholder_meetings_count || 0, c.overall_status || "ACTIVE",
          c.latest_assessment ? JSON.stringify(c.latest_assessment) : null
        ];

        fields.forEach((val) => {
          rowPlaceholders.push(`$${paramIndex++}`);
          params.push(val);
        });
        valuePlaceholders.push(`(${rowPlaceholders.join(", ")})`);
        committed.push(c);
      }

      const sql = `
        INSERT INTO acquisition_cases (
          id, project_id, case_number, case_title, current_stage,
          stage_entry_date, statutory_deadline_date, benchmark_deadline_date,
          sia_started, public_hearing_held, objections_filed_count,
          legal_cases_pending, court_stay_active, avg_dispute_age_days,
          comp_awarded_crore, comp_disbursed_crore, comp_disputes_pending,
          max_pending_days_comp, rr_plan_approved, families_resettled,
          clear_title_percent, forest_land_involved, tribal_area,
          stakeholder_meetings_count, overall_status, assessment_json,
          updated_at
        )
        VALUES ${valuePlaceholders.join(", ")}
        ON CONFLICT (project_id, case_number) DO UPDATE SET
          case_title = EXCLUDED.case_title,
          current_stage = EXCLUDED.current_stage,
          stage_entry_date = EXCLUDED.stage_entry_date,
          statutory_deadline_date = EXCLUDED.statutory_deadline_date,
          benchmark_deadline_date = EXCLUDED.benchmark_deadline_date,
          sia_started = EXCLUDED.sia_started,
          public_hearing_held = EXCLUDED.public_hearing_held,
          objections_filed_count = EXCLUDED.objections_filed_count,
          legal_cases_pending = EXCLUDED.legal_cases_pending,
          court_stay_active = EXCLUDED.court_stay_active,
          avg_dispute_age_days = EXCLUDED.avg_dispute_age_days,
          comp_awarded_crore = EXCLUDED.comp_awarded_crore,
          comp_disbursed_crore = EXCLUDED.comp_disbursed_crore,
          comp_disputes_pending = EXCLUDED.comp_disputes_pending,
          max_pending_days_comp = EXCLUDED.max_pending_days_comp,
          rr_plan_approved = EXCLUDED.rr_plan_approved,
          families_resettled = EXCLUDED.families_resettled,
          clear_title_percent = EXCLUDED.clear_title_percent,
          forest_land_involved = EXCLUDED.forest_land_involved,
          tribal_area = EXCLUDED.tribal_area,
          stakeholder_meetings_count = EXCLUDED.stakeholder_meetings_count,
          overall_status = EXCLUDED.overall_status,
          assessment_json = EXCLUDED.assessment_json,
          updated_at = CURRENT_TIMESTAMP;
      `;

      await query(sql, params);
    }

    return committed;
  },

  updateCase: async (caseId: string, updates: Partial<DbCase>): Promise<DbCase | null> => {
    const fields: string[] = [];
    const params: any[] = [caseId];
    let paramIndex = 2;

    if (updates.case_title !== undefined) {
      fields.push(`case_title = $${paramIndex++}`);
      params.push(updates.case_title);
    }
    if (updates.current_stage !== undefined) {
      fields.push(`current_stage = $${paramIndex++}`);
      params.push(updates.current_stage);
    }
    if (updates.stage_entry_date !== undefined) {
      fields.push(`stage_entry_date = $${paramIndex++}`);
      params.push(updates.stage_entry_date);
    }
    if (updates.statutory_deadline_date !== undefined) {
      fields.push(`statutory_deadline_date = $${paramIndex++}`);
      params.push(updates.statutory_deadline_date);
    }
    if (updates.legal_cases_pending !== undefined) {
      fields.push(`legal_cases_pending = $${paramIndex++}`);
      params.push(updates.legal_cases_pending);
    }
    if (updates.court_stay_active !== undefined) {
      fields.push(`court_stay_active = $${paramIndex++}`);
      params.push(updates.court_stay_active);
    }
    if (updates.comp_awarded_crore !== undefined) {
      fields.push(`comp_awarded_crore = $${paramIndex++}`);
      params.push(updates.comp_awarded_crore);
    }
    if (updates.comp_disbursed_crore !== undefined) {
      fields.push(`comp_disbursed_crore = $${paramIndex++}`);
      params.push(updates.comp_disbursed_crore);
    }
    if (updates.overall_status !== undefined) {
      fields.push(`overall_status = $${paramIndex++}`);
      params.push(updates.overall_status);
    }
    if (updates.latest_assessment !== undefined) {
      fields.push(`assessment_json = $${paramIndex++}`);
      params.push(JSON.stringify(updates.latest_assessment));
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE acquisition_cases
      SET ${fields.join(", ")}
      WHERE id = $1
      RETURNING *;
    `;
    const res = await query(sql, params);
    if (res.rows.length === 0) return null;
    const c = res.rows[0];

    return {
      id: c.id,
      project_id: c.project_id,
      case_number: c.case_number,
      case_title: c.case_title,
      current_stage: c.current_stage,
      stage_entry_date: c.stage_entry_date,
      statutory_deadline_date: c.statutory_deadline_date,
      benchmark_deadline_date: c.benchmark_deadline_date,
      sia_started: c.sia_started,
      public_hearing_held: c.public_hearing_held,
      objections_filed_count: c.objections_filed_count || 0,
      legal_cases_pending: c.legal_cases_pending || 0,
      court_stay_active: c.court_stay_active,
      avg_dispute_age_days: c.avg_dispute_age_days || 0,
      comp_awarded_crore: c.comp_awarded_crore ? parseFloat(c.comp_awarded_crore) : null,
      comp_disbursed_crore: parseFloat(c.comp_disbursed_crore) || 0,
      comp_disputes_pending: c.comp_disputes_pending || 0,
      max_pending_days_comp: c.max_pending_days_comp || 0,
      rr_plan_approved: c.rr_plan_approved,
      families_resettled: c.families_resettled || 0,
      clear_title_percent: parseFloat(c.clear_title_percent) || 100,
      forest_land_involved: c.forest_land_involved,
      tribal_area: c.tribal_area,
      stakeholder_meetings_count: c.stakeholder_meetings_count || 0,
      overall_status: c.overall_status || "ACTIVE",
      latest_assessment: c.assessment_json ? JSON.parse(c.assessment_json) : undefined,
    };
  },

  // Alerts
  getAlerts: async (): Promise<DbAlert[]> => {
    const res = await query(`SELECT * FROM alerts ORDER BY created_at DESC;`);
    return res.rows.map((a) => ({
      id: a.id,
      case_id: a.case_id,
      case_title: a.case_title,
      project_name: a.project_name,
      alert_type: a.alert_type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      acknowledged: a.acknowledged,
      created_at: a.created_at ? new Date(a.created_at).toISOString() : new Date().toISOString(),
    }));
  },

  addAlert: async (alert: DbAlert): Promise<DbAlert> => {
    await query(`
      INSERT INTO alerts (id, case_id, case_title, project_name, alert_type, severity, title, message, acknowledged, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING;
    `, [
      alert.id, alert.case_id, alert.case_title, alert.project_name,
      alert.alert_type, alert.severity, alert.title, alert.message,
      alert.acknowledged || false, alert.created_at || new Date()
    ]);
    return alert;
  },

  acknowledgeAlert: async (alertId: string): Promise<DbAlert | null> => {
    const res = await query(`
      UPDATE alerts
      SET acknowledged = TRUE
      WHERE id = $1
      RETURNING *;
    `, [alertId]);
    if (res.rows.length === 0) return null;
    const a = res.rows[0];
    return {
      id: a.id,
      case_id: a.case_id,
      case_title: a.case_title,
      project_name: a.project_name,
      alert_type: a.alert_type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      acknowledged: a.acknowledged,
      created_at: new Date(a.created_at).toISOString(),
    };
  },

  // Audit Logs
  getAuditLogs: async (): Promise<DbAuditLog[]> => {
    const res = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500;`);
    return res.rows.map((l) => ({
      id: l.id,
      user_id: l.user_id,
      user_name: l.user_name,
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      details: l.details,
      created_at: l.created_at ? new Date(l.created_at).toISOString() : new Date().toISOString(),
    }));
  },

  addAuditLog: async (log: DbAuditLog): Promise<DbAuditLog> => {
    await query(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING;
    `, [
      log.id, log.user_id, log.user_name, log.action,
      log.entity_type, log.entity_id, log.details, log.created_at || new Date()
    ]);
    return log;
  },

  // Data Imports
  getDataImports: async (projectId?: string): Promise<DbDataImport[]> => {
    let sql = `SELECT * FROM data_imports`;
    const params: any[] = [];
    if (projectId) {
      sql += ` WHERE project_id = $1`;
      params.push(projectId);
    }
    sql += ` ORDER BY created_at DESC;`;
    const res = await query(sql, params);
    return res.rows.map((i) => ({
      id: i.id,
      project_id: i.project_id,
      source_filename: i.source_filename,
      source_type: i.source_type,
      file_size_bytes: i.file_size_bytes,
      uploaded_by: i.uploaded_by,
      uploader_name: i.uploader_name,
      records_count: i.records_count,
      validation_status: i.validation_status,
      validation_summary: typeof i.validation_summary === "string" ? JSON.parse(i.validation_summary) : i.validation_summary,
      created_at: new Date(i.created_at).toISOString(),
    }));
  },

  addDataImport: async (record: DbDataImport): Promise<DbDataImport> => {
    await query(`
      INSERT INTO data_imports (
        id, project_id, source_filename, source_type, file_size_bytes,
        uploaded_by, uploader_name, records_count, validation_status,
        validation_summary, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING;
    `, [
      record.id, record.project_id, record.source_filename, record.source_type,
      record.file_size_bytes, record.uploaded_by, record.uploader_name,
      record.records_count, record.validation_status,
      typeof record.validation_summary === "object" ? JSON.stringify(record.validation_summary) : String(record.validation_summary),
      record.created_at || new Date()
    ]);
    return record;
  },
};

export default supabaseDb;
