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

  const pRes = await client.query(`
    SELECT p.id, p.project_name, count(c.id)::int as case_count
    FROM projects p
    LEFT JOIN acquisition_cases c ON p.id = c.project_id
    GROUP BY p.id
    ORDER BY count(c.id) DESC
    LIMIT 5;
  `);
  console.log("Top 5 projects with case count from Supabase:", pRes.rows);

  const singleProject = await client.query(`
    SELECT p.*, count(c.id)::int as case_count
    FROM projects p
    LEFT JOIN acquisition_cases c ON p.id = c.project_id
    WHERE p.id = 'PRJ-IN-202'
    GROUP BY p.id;
  `);
  console.log("PRJ-IN-202 lookup result:", singleProject.rows[0]);

  await client.end();
}

test().catch(console.error);
