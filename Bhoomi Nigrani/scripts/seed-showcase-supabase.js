const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let databaseUrl = '';
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    databaseUrl = trimmed.split('=')[1].replace(/^["']|["']$/g, '');
  }
});

const sessionUrl = databaseUrl.replace(':6543/postgres?pgbouncer=true', ':5432/postgres');

async function seed() {
  console.log("=== Seeding Showcase Dataset to Supabase ===");
  const jsonPath = path.join(__dirname, "showcase_dataset.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error("Showcase dataset JSON not found. Run generate-showcase-dataset.py first.");
  }

  const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const { states, districts, projects, cases, metadata } = dataset;

  console.log(`Loaded dataset:`, metadata);

  const client = new Client({ connectionString: sessionUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query('BEGIN;');

    // 1. States
    console.log(`1/4 Seeding ${states.length} States...`);
    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      await client.query(`
        INSERT INTO states (state_code, state_name)
        VALUES ($1, $2)
        ON CONFLICT (state_code) DO UPDATE
        SET state_name = EXCLUDED.state_name;
      `, [s.state_code, s.state_name]);
    }
    console.log(" ✓ States seeded.");

    // 2. Districts
    console.log(`2/4 Seeding ${districts.length} Districts...`);
    const districtIdMap = new Map(); // key: "state_code:district_name" -> DB id
    for (let i = 0; i < districts.length; i++) {
      const d = districts[i];
      const res = await client.query(`
        INSERT INTO districts (district_name, state_code)
        VALUES ($1, $2)
        ON CONFLICT (district_name, state_code) DO UPDATE
        SET district_name = EXCLUDED.district_name
        RETURNING id;
      `, [d.district_name, d.state_code]);
      districtIdMap.set(`${d.state_code}:${d.district_name}`, res.rows[0].id);
    }
    console.log(" ✓ Districts seeded.");

    // 3. Projects
    console.log(`3/4 Seeding ${projects.length} Projects...`);
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const realDistrictId = districtIdMap.get(`${p.state_code}:${p.district_name}`) || p.district_id;

      await client.query(`
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
        p.id, p.project_name, p.project_type, p.funding_model, p.implementing_agency,
        realDistrictId, p.district_name, p.state_code, p.state_name, p.land_area_ha,
        p.num_affected_families, p.budget_crore, p.project_start_date, p.description,
        p.is_demo_data
      ]);
    }
    console.log(` ✓ ${projects.length} Projects seeded.`);

    // 4. Cases
    console.log(`4/4 Seeding ${cases.length} Cases...`);
    const batchSize = 100;
    for (let b = 0; b < cases.length; b += batchSize) {
      const chunk = cases.slice(b, b + batchSize);
      for (const c of chunk) {
        await client.query(`
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
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP)
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
        `, [
          c.id, c.project_id, c.case_number, c.case_title, c.current_stage,
          c.stage_entry_date, c.statutory_deadline_date, c.benchmark_deadline_date,
          c.sia_started, c.public_hearing_held, c.objections_filed_count,
          c.legal_cases_pending, c.court_stay_active, c.avg_dispute_age_days,
          c.comp_awarded_crore, c.comp_disbursed_crore, c.comp_disputes_pending,
          c.max_pending_days_comp, c.rr_plan_approved, c.families_resettled,
          c.clear_title_percent, c.forest_land_involved, c.tribal_area,
          c.stakeholder_meetings_count, c.overall_status, c.assessment_json
        ]);
      }
    }
    console.log(` ✓ ${cases.length} Cases seeded.`);

    // 5. Create active alerts for Critical ML cases
    console.log("Generating critical operational alerts...");
    const critCases = await client.query(`
      SELECT c.id, c.case_title, p.project_name, (c.assessment_json::jsonb->'prediction'->>'risk_level') as risk
      FROM acquisition_cases c
      JOIN projects p ON c.project_id = p.id
      WHERE (c.assessment_json::jsonb->'prediction'->>'risk_level') = 'CRITICAL'
      LIMIT 8;
    `);

    for (const row of critCases.rows) {
      const alertId = `alt-${row.id}`;
      await client.query(`
        INSERT INTO alerts (id, case_id, case_title, project_name, alert_type, severity, title, message, acknowledged, created_at)
        VALUES ($1, $2, $3, $4, 'RISK_ESCALATION', 'CRITICAL', $5, $6, false, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING;
      `, [
        alertId, row.id, row.case_title, row.project_name,
        `Escalated Risk: ${row.case_title}`,
        `Model detected high delay probability due to legal dispute aging and pending compensation backlog in ${row.project_name}.`
      ]);
    }

    // 6. Audit log for provenance
    await client.query(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, details, created_at)
      VALUES (
        $1, '00000000-0000-0000-0000-000000000000', 'System Seed Job',
        'SHOWCASE_DATASET_SEEDED', 'SYSTEM', 'SHOWCASE_V2',
        $2, CURRENT_TIMESTAMP
      );
    `, [
      `audit-seed-${Date.now()}`,
      JSON.stringify({ provenance: 'synthetic_showcase', projects: projects.length, cases: cases.length, states: states.length })
    ]);

    await client.query('COMMIT;');
    console.log("\n=======================================================");
    console.log("✓ ALL SHOWCASE RECORDS SUCCESSFULLY COMMITTED TO SUPABASE");
    console.log("=======================================================\n");

  } catch (err) {
    await client.query('ROLLBACK;');
    console.error("Failed to seed showcase dataset:", err);
    throw err;
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
