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

async function inspect() {
  const client = new Client({ connectionString: sessionUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const tables = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("Public tables in Supabase:", tables.rows);
  await client.end();
}

inspect();
