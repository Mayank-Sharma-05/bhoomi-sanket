const { Client } = require('pg');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let databaseUrl = '';
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    databaseUrl = trimmed.split('=')[1].replace(/^["']|["']$/g, '');
  }
});

const sessionUrl = databaseUrl.replace(':6543/postgres?pgbouncer=true', ':5432/postgres');

const schemaSql = `
-- 1. States table
CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  state_code VARCHAR(10) UNIQUE NOT NULL,
  state_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Districts table
CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  district_name VARCHAR(255) NOT NULL,
  state_code VARCHAR(10) NOT NULL REFERENCES states(state_code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_district_state UNIQUE (district_name, state_code)
);

-- 3. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL,
  funding_model VARCHAR(100) DEFAULT 'government',
  implementing_agency VARCHAR(255),
  district_id INT NOT NULL REFERENCES districts(id),
  district_name VARCHAR(255) NOT NULL,
  state_code VARCHAR(10) NOT NULL REFERENCES states(state_code),
  state_name VARCHAR(255) NOT NULL,
  land_area_ha DOUBLE PRECISION,
  num_affected_families INT,
  budget_crore DOUBLE PRECISION,
  project_start_date VARCHAR(50),
  description TEXT,
  is_demo_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Acquisition Cases table
CREATE TABLE IF NOT EXISTS acquisition_cases (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  case_number VARCHAR(255) NOT NULL,
  case_title VARCHAR(255) NOT NULL,
  current_stage VARCHAR(50) DEFAULT 'SIA',
  stage_entry_date VARCHAR(50) NOT NULL,
  statutory_deadline_date VARCHAR(50),
  benchmark_deadline_date VARCHAR(50),
  sia_started BOOLEAN DEFAULT FALSE,
  public_hearing_held BOOLEAN DEFAULT FALSE,
  objections_filed_count INT DEFAULT 0,
  legal_cases_pending INT DEFAULT 0,
  court_stay_active BOOLEAN DEFAULT FALSE,
  avg_dispute_age_days INT DEFAULT 0,
  comp_awarded_crore DOUBLE PRECISION,
  comp_disbursed_crore DOUBLE PRECISION DEFAULT 0,
  comp_disputes_pending INT DEFAULT 0,
  max_pending_days_comp INT DEFAULT 0,
  rr_plan_approved BOOLEAN DEFAULT FALSE,
  families_resettled INT DEFAULT 0,
  clear_title_percent DOUBLE PRECISION DEFAULT 100,
  forest_land_involved BOOLEAN DEFAULT FALSE,
  tribal_area BOOLEAN DEFAULT FALSE,
  stakeholder_meetings_count INT DEFAULT 0,
  overall_status VARCHAR(50) DEFAULT 'ACTIVE',
  assessment_json TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_project_case UNIQUE (project_id, case_number)
);

-- 5. Stage Duration Configs table
CREATE TABLE IF NOT EXISTS stage_duration_configs (
  stage VARCHAR(50) PRIMARY KEY,
  duration_type VARCHAR(50) NOT NULL,
  default_days INT NOT NULL,
  legal_reference VARCHAR(255) NOT NULL,
  is_statutory BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(255) PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL,
  case_title VARCHAR(255) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Data Imports table
CREATE TABLE IF NOT EXISTS data_imports (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_filename VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  file_size_bytes INT NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  uploader_name VARCHAR(255) NOT NULL,
  records_count INT NOT NULL,
  validation_status VARCHAR(50) NOT NULL,
  validation_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_project_id ON acquisition_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_cases_stage ON acquisition_cases(current_stage);
CREATE INDEX IF NOT EXISTS idx_cases_status ON acquisition_cases(overall_status);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state_code);
CREATE INDEX IF NOT EXISTS idx_projects_district ON projects(district_id);
CREATE INDEX IF NOT EXISTS idx_alerts_ack ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
`;

async function createSchema() {
  console.log("Connecting to Supabase to create PostgreSQL schema...");
  const client = new Client({ connectionString: sessionUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected! Executing DDL statements...");
  await client.query(schemaSql);
  console.log("✓ Schema created successfully!");

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("Created tables in Supabase:", tables.rows.map(r => r.table_name));
  await client.end();
}

createSchema().catch(err => {
  console.error("Schema creation failed:", err);
  process.exit(1);
});
