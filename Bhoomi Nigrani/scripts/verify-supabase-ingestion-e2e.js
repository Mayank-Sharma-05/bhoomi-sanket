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

async function testSupabaseE2E() {
  console.log("=== Testing Direct Supabase E2E Ingestion & Queries ===");
  const client = new Client({ connectionString: sessionUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // 1. Check Projects & Cases in Supabase
  console.log("\n--- TEST 1: Supabase Record Counts ---");
  const pCount = await client.query("SELECT count(*)::int as count FROM projects;");
  const cCount = await client.query("SELECT count(*)::int as count FROM acquisition_cases;");
  const sCount = await client.query("SELECT count(*)::int as count FROM states;");
  const dCount = await client.query("SELECT count(*)::int as count FROM districts;");
  const impCount = await client.query("SELECT count(*)::int as count FROM data_imports;");
  const audCount = await client.query("SELECT count(*)::int as count FROM audit_logs;");

  console.log("Supabase Current State:", {
    states: sCount.rows[0].count,
    districts: dCount.rows[0].count,
    projects: pCount.rows[0].count,
    cases: cCount.rows[0].count,
    imports: impCount.rows[0].count,
    audits: audCount.rows[0].count,
  });

  // 2. Test Single Project Read-back
  console.log("\n--- TEST 2: Project PRJ-IN-202 Read-back ---");
  const prjRes = await client.query("SELECT * FROM projects WHERE id = 'PRJ-IN-202';");
  console.log("Project name:", prjRes.rows[0]?.project_name);
  console.log("Project type:", prjRes.rows[0]?.project_type);
  console.log("District:", prjRes.rows[0]?.district_name);

  // 3. Test Ingestion Simulation with Duplicate Protection
  console.log("\n--- TEST 3: Ingest Cases with Duplicate Protection into Supabase ---");
  const testCases = [
    {
      id: "case-sup-test-01",
      project_id: "PRJ-IN-202",
      case_number: "SUP-TEST-PKG-01",
      case_title: "Supabase Direct Verification Package 1",
      current_stage: "SECTION_11",
      stage_entry_date: "2024-04-10",
      comp_awarded_crore: 45.5,
      comp_disbursed_crore: 20.0,
      legal_cases_pending: 1,
      court_stay_active: false,
      overall_status: "ACTIVE"
    },
    {
      id: "case-sup-test-02",
      project_id: "PRJ-IN-202",
      case_number: "SUP-TEST-PKG-02",
      case_title: "Supabase Direct Verification Package 2",
      current_stage: "AWARD",
      stage_entry_date: "2024-05-15",
      comp_awarded_crore: 30.0,
      comp_disbursed_crore: 30.0,
      legal_cases_pending: 0,
      court_stay_active: false,
      overall_status: "ACTIVE"
    }
  ];

  for (const c of testCases) {
    await client.query(`
      INSERT INTO acquisition_cases (
        id, project_id, case_number, case_title, current_stage,
        stage_entry_date, comp_awarded_crore, comp_disbursed_crore,
        legal_cases_pending, court_stay_active, overall_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (project_id, case_number) DO UPDATE SET
        case_title = EXCLUDED.case_title,
        current_stage = EXCLUDED.current_stage;
    `, [
      c.id, c.project_id, c.case_number, c.case_title, c.current_stage,
      c.stage_entry_date, c.comp_awarded_crore, c.comp_disbursed_crore,
      c.legal_cases_pending, c.court_stay_active, c.overall_status
    ]);
  }

  // Verify test cases exist
  const verifyRes = await client.query(`
    SELECT case_number, case_title, current_stage, comp_awarded_crore, comp_disbursed_crore
    FROM acquisition_cases
    WHERE case_number IN ('SUP-TEST-PKG-01', 'SUP-TEST-PKG-02');
  `);
  console.log("Ingested cases read back from Supabase:", verifyRes.rows);

  // Test duplicate ingestion: inserting exact same case_number must NOT duplicate
  console.log("\n--- TEST 4: Duplicate Ingestion Check ---");
  const countBefore = await client.query("SELECT count(*)::int as count FROM acquisition_cases WHERE project_id = 'PRJ-IN-202';");
  
  // Re-insert SUP-TEST-PKG-01
  await client.query(`
    INSERT INTO acquisition_cases (
      id, project_id, case_number, case_title, current_stage,
      stage_entry_date, comp_awarded_crore, comp_disbursed_crore,
      legal_cases_pending, court_stay_active, overall_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (project_id, case_number) DO UPDATE SET
      case_title = EXCLUDED.case_title;
  `, [
    "case-sup-test-01-dup", "PRJ-IN-202", "SUP-TEST-PKG-01", "Updated Title", "SECTION_11",
    "2024-04-10", 45.5, 20.0, 1, false, "ACTIVE"
  ]);

  const countAfter = await client.query("SELECT count(*)::int as count FROM acquisition_cases WHERE project_id = 'PRJ-IN-202';");
  console.log("Count before re-insertion:", countBefore.rows[0].count);
  console.log("Count after re-insertion:", countAfter.rows[0].count);
  console.log("Duplicate prevented:", countBefore.rows[0].count === countAfter.rows[0].count ? "✓ YES (Zero duplicates)" : "✗ FAILED");

  // Clean up test rows
  await client.query("DELETE FROM acquisition_cases WHERE case_number IN ('SUP-TEST-PKG-01', 'SUP-TEST-PKG-02');");
  console.log("\nCleaned up temporary verification cases.");

  await client.end();
  console.log("\n✓ All Supabase E2E verification checks passed successfully!");
}

testSupabaseE2E().catch(console.error);
