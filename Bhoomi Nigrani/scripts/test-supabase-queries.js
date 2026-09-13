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

async function test() {
  const client = new Client({ connectionString: sessionUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query("DELETE FROM projects WHERE id LIKE 'proj-%';");

  const summary = await client.query(`
    SELECT 
      COUNT(*) as total_projects, 
      COUNT(DISTINCT state_code) as state_count, 
      COUNT(DISTINCT district_name) as district_count 
    FROM projects;
  `);
  console.log("Projects summary:", summary.rows[0]);

  const stateBreakdown = await client.query(`
    SELECT 
      p.state_code, 
      p.state_name, 
      COUNT(DISTINCT p.id) as project_count,
      COUNT(c.id) as case_count,
      COUNT(c.id) FILTER (WHERE c.assessment_json IS NOT NULL) as assessed_cases,
      COUNT(c.id) FILTER (WHERE c.assessment_json IS NULL) as unassessed_cases
    FROM projects p
    LEFT JOIN acquisition_cases c ON p.id = c.project_id
    GROUP BY p.state_code, p.state_name
    ORDER BY p.state_code ASC;
  `);
  console.log("\nState Breakdown (Total States: " + stateBreakdown.rows.length + "):");
  console.table(stateBreakdown.rows);

  await client.end();
}

test().catch(console.error);
