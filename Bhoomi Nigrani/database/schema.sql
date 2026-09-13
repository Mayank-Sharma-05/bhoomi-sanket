-- ═══════════════════════════════════════════════════════════════
-- BHOOMI SANKET — DATABASE SCHEMA (PostgreSQL 15 + PostGIS 3)
-- SIH26017 | Team: Bhoomi Nigrani
-- ═══════════════════════════════════════════════════════════════

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- 1. REFERENCE GEOGRAPHIC TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS states (
  id          SERIAL PRIMARY KEY,
  state_code  TEXT UNIQUE NOT NULL,   -- e.g. 'UP', 'MH', 'KA', 'MP', 'GJ'
  state_name  TEXT NOT NULL,
  geometry    GEOMETRY(MultiPolygon, 4326),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS districts (
  id            SERIAL PRIMARY KEY,
  district_name TEXT NOT NULL,
  state_code    TEXT NOT NULL REFERENCES states(state_code) ON DELETE RESTRICT,
  geometry      GEOMETRY(MultiPolygon, 4326),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(district_name, state_code)
);

CREATE INDEX IF NOT EXISTS idx_districts_state_code ON districts(state_code);
CREATE INDEX IF NOT EXISTS idx_districts_geometry   ON districts USING GIST(geometry);

-- ═══════════════════════════════════════════════════════════════
-- 2. USER PROFILES & RBAC
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'ADMIN', 'CENTRAL_OFFICER', 'STATE_OFFICER', 'DISTRICT_OFFICER', 'PROJECT_MANAGER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY,       -- Maps to Supabase auth.users.id
  full_name    TEXT NOT NULL,
  designation  TEXT,                   -- e.g. "District Land Acquisition Officer"
  role         user_role NOT NULL DEFAULT 'DISTRICT_OFFICER',
  state_code   TEXT REFERENCES states(state_code),
  district_id  INTEGER REFERENCES districts(id),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role        ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_district_id ON user_profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state_code  ON user_profiles(state_code);

-- ═══════════════════════════════════════════════════════════════
-- 3. PROJECTS & ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM (
    'highway', 'railway', 'industrial', 'power', 'urban', 'irrigation', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE funding_model AS ENUM (
    'government', 'PPP', 'private', 'unknown'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS projects (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name          TEXT NOT NULL,
  project_type          project_type NOT NULL,
  funding_model         funding_model NOT NULL DEFAULT 'unknown',
  implementing_agency   TEXT,                -- e.g. "NHAI", "Ministry of Railways"
  district_id           INTEGER NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  state_code            TEXT NOT NULL REFERENCES states(state_code) ON DELETE RESTRICT,
  land_area_ha          DECIMAL(12,3),       -- Total project footprint in hectares
  num_affected_families INTEGER,
  budget_crore          DECIMAL(15,2),
  project_start_date    DATE,
  location_centroid     GEOMETRY(Point, 4326),
  description           TEXT,
  is_demo_data          BOOLEAN DEFAULT TRUE, -- Always TRUE in MVP for transparency
  created_by            UUID REFERENCES user_profiles(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_district_id      ON projects(district_id);
CREATE INDEX IF NOT EXISTS idx_projects_state_code       ON projects(state_code);
CREATE INDEX IF NOT EXISTS idx_projects_location_centroid ON projects USING GIST(location_centroid);

CREATE TABLE IF NOT EXISTS project_assignments (
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 4. STAGE DURATION CONFIGURATIONS (R2: Statutory vs Benchmark)
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE acquisition_stage AS ENUM (
    'SIA', 'SECTION_11', 'SECTION_19', 'AWARD', 'POSSESSION', 'RR', 'CLOSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE duration_authority AS ENUM (
    'STATUTORY_MANDATE', 'OPERATIONAL_BENCHMARK'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS stage_duration_configs (
  stage                 acquisition_stage PRIMARY KEY,
  duration_type         duration_authority NOT NULL,
  default_days          INTEGER NOT NULL,
  legal_reference       TEXT NOT NULL,
  is_statutory          BOOLEAN NOT NULL DEFAULT FALSE,
  description           TEXT,
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Insert baseline duration standards
INSERT INTO stage_duration_configs (stage, duration_type, default_days, legal_reference, is_statutory, description) VALUES
  ('SIA', 'STATUTORY_MANDATE', 180, 'RFCTLARR Act 2013, Section 4(2)', TRUE, 'SIA study and report submission window'),
  ('SECTION_11', 'STATUTORY_MANDATE', 365, 'RFCTLARR Act 2013, Section 19(1)', TRUE, 'Section 19 declaration must occur within 12 months of Section 11 notification'),
  ('SECTION_19', 'STATUTORY_MANDATE', 365, 'RFCTLARR Act 2013, Section 25', TRUE, 'Award must be announced within 12 months of Section 19 declaration'),
  ('AWARD', 'OPERATIONAL_BENCHMARK', 90, 'Operational Benchmark (Configurable)', FALSE, 'Time to complete deposit/disbursement before possession notice'),
  ('POSSESSION', 'OPERATIONAL_BENCHMARK', 180, 'Operational Benchmark (Configurable)', FALSE, 'Time to execute physical takeover and transition to full R&R delivery'),
  ('RR', 'OPERATIONAL_BENCHMARK', 365, 'Operational Benchmark (Configurable)', FALSE, 'R&R implementation and infrastructure monitoring period'),
  ('CLOSED', 'OPERATIONAL_BENCHMARK', 0, 'Terminal State', FALSE, 'Case concluded')
ON CONFLICT (stage) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 5. ACQUISITION CASES (R3: 1:Many Project-to-Case Model)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS acquisition_cases (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                          -- 1:many: multiple acquisition cases allowed per project
  case_number             TEXT NOT NULL DEFAULT 'PHASE-01', -- e.g. "ROUND-01", "PKG-2A"
  case_title              TEXT,                             -- e.g. "Main Alignment Right-of-Way"
  current_stage           acquisition_stage NOT NULL DEFAULT 'SIA',
  stage_entry_date        DATE NOT NULL,
  statutory_deadline_date DATE,           -- Computed for statutory stages; NULL otherwise
  benchmark_deadline_date DATE,           -- Computed for benchmark stages; NULL otherwise

  -- SIA parameters
  sia_started             BOOLEAN DEFAULT FALSE,
  sia_start_date          DATE,
  sia_completion_date     DATE,
  public_hearing_held     BOOLEAN DEFAULT FALSE,
  public_hearing_date     DATE,
  objections_filed_count  INTEGER DEFAULT 0,

  -- Litigation parameters
  legal_cases_pending     INTEGER DEFAULT 0,
  court_stay_active       BOOLEAN DEFAULT FALSE,
  avg_dispute_age_days    INTEGER,

  -- Compensation parameters
  comp_awarded_crore      DECIMAL(15,2),
  comp_disbursed_crore    DECIMAL(15,2) DEFAULT 0,
  comp_disputes_pending   INTEGER DEFAULT 0,
  max_pending_days_comp   INTEGER DEFAULT 0,

  -- Rehabilitation parameters
  rr_plan_approved        BOOLEAN DEFAULT FALSE,
  rr_plan_approval_date   DATE,
  families_resettled      INTEGER DEFAULT 0,

  -- Land record parameters
  clear_title_percent     DECIMAL(5,2),   -- 0-100%
  forest_land_involved    BOOLEAN DEFAULT FALSE,
  tribal_area             BOOLEAN DEFAULT FALSE,

  -- Stakeholder responsiveness
  stakeholder_meetings_count INTEGER DEFAULT 0,
  possession_taken        BOOLEAN DEFAULT FALSE,
  possession_date         DATE,

  -- Metadata
  overall_status          TEXT DEFAULT 'ACTIVE' CHECK (overall_status IN ('ACTIVE','CLOSED','CANCELLED')),
  notes                   TEXT,
  last_updated_by         UUID REFERENCES user_profiles(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, case_number)
);

CREATE INDEX IF NOT EXISTS idx_cases_project_id     ON acquisition_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_cases_current_stage  ON acquisition_cases(current_stage);
CREATE INDEX IF NOT EXISTS idx_cases_overall_status ON acquisition_cases(overall_status);

-- ═══════════════════════════════════════════════════════════════
-- 6. STAGE TRANSITION HISTORY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stage_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             UUID NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  from_stage          acquisition_stage,
  to_stage            acquisition_stage NOT NULL,
  transitioned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  transitioned_by     UUID REFERENCES user_profiles(id),
  stage_duration_days INTEGER,
  notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_stage_history_case_id ON stage_history(case_id);

-- ═══════════════════════════════════════════════════════════════
-- 7. SUB-ENTITIES: LITIGATION, COMPENSATION, APPROVALS, R&R
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS legal_cases (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id          UUID NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  case_number      TEXT NOT NULL,
  court_name       TEXT NOT NULL,
  court_level      TEXT CHECK (court_level IN ('district','high_court','supreme_court','tribunal','other')),
  filing_date      DATE NOT NULL,
  dispute_type     TEXT CHECK (dispute_type IN ('compensation','title','public_purpose','consent','other')),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed','stayed')),
  is_stay_active   BOOLEAN DEFAULT FALSE,
  resolution_date  DATE,
  outcome          TEXT CHECK (outcome IN ('favor_government','favor_landowner','settled','dismissed','unknown')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_cases_case_id ON legal_cases(case_id);

CREATE TABLE IF NOT EXISTS compensation_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             UUID NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  parcel_reference    TEXT,
  parcel_area_ha      DECIMAL(10,4),
  land_type           TEXT CHECK (land_type IN ('agricultural','residential','commercial','forest','wasteland','other')),
  owner_count         INTEGER DEFAULT 1,
  awarded_amount      DECIMAL(15,2),
  disbursed_amount    DECIMAL(15,2) DEFAULT 0,
  pending_since_date  DATE,
  dispute_status      TEXT DEFAULT 'none' CHECK (dispute_status IN ('none','negotiation','court','resolved')),
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_records_case_id ON compensation_records(case_id);

CREATE TABLE IF NOT EXISTS approvals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  approval_type   TEXT NOT NULL CHECK (approval_type IN ('SIA','env_clearance','forest_clearance','public_hearing','expert_committee','section_19','other')),
  authority       TEXT,
  applied_date    DATE,
  approval_date   DATE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','not_required')),
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_case_id ON approvals(case_id);

CREATE TABLE IF NOT EXISTS rr_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id               UUID UNIQUE NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  total_families        INTEGER NOT NULL,
  land_to_be_allotted   BOOLEAN DEFAULT FALSE,
  jobs_to_be_allotted   BOOLEAN DEFAULT FALSE,
  housing_to_be_allotted BOOLEAN DEFAULT FALSE,
  rr_plan_submitted_date DATE,
  rr_plan_approved_date  DATE,
  land_allotted_families INTEGER DEFAULT 0,
  jobs_allotted_families INTEGER DEFAULT 0,
  housed_families        INTEGER DEFAULT 0,
  resettled_families     INTEGER DEFAULT 0,
  training_programs_started BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id    UUID NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES user_profiles(id),
  note_text  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON case_notes(case_id);

-- ═══════════════════════════════════════════════════════════════
-- 8. RISK ASSESSMENTS & PREDICTION LOGS (Immutable)
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE prediction_quality AS ENUM ('FULL', 'PARTIAL', 'DEGRADED', 'STUB');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS risk_assessments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             UUID NOT NULL REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  assessed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_version       TEXT NOT NULL,
  schema_version      TEXT NOT NULL DEFAULT 'v1',
  trigger_event       TEXT NOT NULL CHECK (trigger_event IN ('CASE_UPDATE','BATCH_REFRESH','MANUAL')),

  -- Predictions
  risk_probability    DECIMAL(5,4) NOT NULL,   -- 0.0000 to 1.0000
  risk_level          risk_level NOT NULL,
  confidence          TEXT CHECK (confidence IN ('HIGH','MEDIUM','LOW')),
  prediction_quality  prediction_quality NOT NULL,

  -- SHAP Factor Attribution & Recommendations
  base_probability    DECIMAL(5,4),
  top_factors         JSONB NOT NULL DEFAULT '[]',
  recommendations     JSONB NOT NULL DEFAULT '[]',

  -- Features snapshot for auditing
  features_snapshot   JSONB NOT NULL DEFAULT '{}',
  features_used       INTEGER,
  features_missing    INTEGER,
  missing_feature_names JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_case_id     ON risk_assessments(case_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_at ON risk_assessments(assessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level  ON risk_assessments(risk_level);

-- ═══════════════════════════════════════════════════════════════
-- 9. ALERTS & NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM (
    'RISK_ESCALATION', 'DEADLINE_BREACH', 'STALENESS', 'COURT_STAY', 'SYSTEM'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id          UUID REFERENCES acquisition_cases(id) ON DELETE CASCADE,
  alert_type       alert_type NOT NULL,
  severity         risk_level NOT NULL,
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_case_id    ON alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity   ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

CREATE TABLE IF NOT EXISTS alert_acknowledgments (
  alert_id         UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  acknowledged_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id     UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('email','sms','push')),
  status       TEXT NOT NULL DEFAULT 'suppressed' CHECK (status IN ('pending','sent','failed','suppressed')),
  sent_at      TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 10. AUDIT LOGS (Append-Only)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES user_profiles(id),
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID NOT NULL,
  old_value    JSONB,
  new_value    JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 10B. DATA INGESTION & PROVENANCE (Append-Only)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS data_imports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_filename     TEXT NOT NULL,
  source_type         TEXT NOT NULL CHECK (source_type IN ('CSV', 'XLSX', 'XLS', 'PDF')),
  file_size_bytes     INTEGER,
  uploaded_by         UUID REFERENCES user_profiles(id),
  uploader_name       TEXT,
  records_count       INTEGER DEFAULT 0,
  validation_status   TEXT NOT NULL CHECK (validation_status IN ('PENDING', 'VALIDATED', 'IMPORT_FAILED', 'CONFIRMED')),
  validation_summary  JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_imports_project_id ON data_imports(project_id);
CREATE INDEX IF NOT EXISTS idx_data_imports_created_at ON data_imports(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 11. ANALYTICAL VIEWS
-- ═══════════════════════════════════════════════════════════════

-- View 1: Deduplicated latest risk assessment per case
CREATE OR REPLACE VIEW latest_risk_assessments AS
SELECT DISTINCT ON (case_id) *
FROM risk_assessments
ORDER BY case_id, assessed_at DESC;

-- View 2: Case Risk Summary (Operational Unit)
CREATE OR REPLACE VIEW case_risk_summary AS
SELECT
  ac.id                      AS case_id,
  ac.case_number,
  ac.case_title,
  ac.current_stage,
  ac.stage_entry_date,
  ac.statutory_deadline_date,
  ac.benchmark_deadline_date,
  ac.overall_status,
  ac.legal_cases_pending,
  ac.court_stay_active,
  ac.comp_awarded_crore,
  ac.comp_disbursed_crore,
  ac.rr_plan_approved,
  ac.families_resettled,
  ac.clear_title_percent,
  ac.forest_land_involved,
  ac.tribal_area,
  ac.stakeholder_meetings_count,
  ac.public_hearing_held,
  -- Project context
  p.id                       AS project_id,
  p.project_name,
  p.project_type,
  p.funding_model,
  p.district_id,
  p.state_code,
  p.land_area_ha,
  p.num_affected_families,
  p.is_demo_data,
  -- Assessment metrics
  ra.risk_probability,
  ra.risk_level,
  ra.confidence,
  ra.prediction_quality,
  ra.top_factors,
  ra.recommendations,
  ra.assessed_at             AS risk_assessed_at,
  ra.model_version
FROM acquisition_cases ac
JOIN projects p ON p.id = ac.project_id
LEFT JOIN latest_risk_assessments ra ON ra.case_id = ac.id;

-- View 3: Project Risk Summary (Portfolio Unit Aggregating Multi-Cases)
CREATE OR REPLACE VIEW project_risk_summary AS
SELECT
  p.id                                                        AS project_id,
  p.project_name,
  p.project_type,
  p.funding_model,
  p.district_id,
  p.state_code,
  p.land_area_ha,
  p.num_affected_families,
  p.budget_crore,
  p.is_demo_data,
  COUNT(ac.id)                                                AS total_cases,
  COUNT(CASE WHEN ac.overall_status = 'ACTIVE' THEN 1 END)    AS active_cases,
  COALESCE(AVG(ra.risk_probability), 0.0)                     AS avg_risk_probability,
  MAX(CASE WHEN ra.risk_level = 'CRITICAL' THEN 4
           WHEN ra.risk_level = 'HIGH' THEN 3
           WHEN ra.risk_level = 'MEDIUM' THEN 2
           WHEN ra.risk_level = 'LOW' THEN 1 ELSE 0 END)      AS highest_risk_tier,
  COUNT(CASE WHEN ra.risk_level = 'CRITICAL' THEN 1 END)      AS critical_cases_count,
  COUNT(CASE WHEN ra.risk_level = 'HIGH' THEN 1 END)          AS high_cases_count
FROM projects p
LEFT JOIN acquisition_cases ac ON ac.project_id = p.id
LEFT JOIN latest_risk_assessments ra ON ra.case_id = ac.id
GROUP BY p.id, p.project_name, p.project_type, p.funding_model, p.district_id, p.state_code, p.land_area_ha, p.num_affected_families, p.budget_crore, p.is_demo_data;

-- ═══════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes        ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS evaluation
CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT AS $$
  SELECT COALESCE((SELECT role::TEXT FROM user_profiles WHERE id = auth.uid()), 'ANONYMOUS');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_district_id() RETURNS INTEGER AS $$
  SELECT district_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_state_code() RETURNS TEXT AS $$
  SELECT state_code FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Projects RLS Policies
CREATE POLICY "projects_select_policy" ON projects FOR SELECT
  USING (
    auth_role() IN ('ADMIN', 'CENTRAL_OFFICER')
    OR (auth_role() = 'STATE_OFFICER' AND state_code = auth_state_code())
    OR (auth_role() = 'DISTRICT_OFFICER' AND district_id = auth_district_id())
    OR (auth_role() = 'PROJECT_MANAGER' AND id IN (
      SELECT project_id FROM project_assignments WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "projects_insert_policy" ON projects FOR INSERT
  WITH CHECK (
    auth_role() IN ('ADMIN', 'DISTRICT_OFFICER')
    AND (auth_role() = 'ADMIN' OR district_id = auth_district_id())
  );

-- Acquisition Cases RLS Policies (cascades with project visibility)
CREATE POLICY "cases_select_policy" ON acquisition_cases FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects)
  );

CREATE POLICY "cases_update_policy" ON acquisition_cases FOR UPDATE
  USING (
    auth_role() = 'ADMIN'
    OR (auth_role() = 'DISTRICT_OFFICER' AND project_id IN (
      SELECT id FROM projects WHERE district_id = auth_district_id()
    ))
  );

-- Audit Logs RLS Policies (Append-only)
CREATE POLICY "audit_logs_select_policy" ON audit_logs FOR SELECT
  USING (auth_role() IN ('ADMIN', 'CENTRAL_OFFICER'));

CREATE POLICY "audit_logs_insert_policy" ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_logs_block_update" ON audit_logs FOR UPDATE USING (FALSE);
CREATE POLICY "audit_logs_block_delete" ON audit_logs FOR DELETE USING (FALSE);
