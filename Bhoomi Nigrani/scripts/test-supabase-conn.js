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

// Test with DATABASE_URL
async function testPooler(url, name) {
  console.log(`\nTesting ${name} with:`, url.replace(/:[^:@]+@/, ':****@'));
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✓ Connected successfully via ${name}!`);
    const res = await client.query("SELECT current_database(), current_user, version();");
    console.log("Database info:", res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.error(`✗ ${name} failed:`, err.message);
    return false;
  }
}

async function run() {
  await testPooler(databaseUrl, "Transaction Pooler (6543)");
  // Also test session pooler (5432)
  const sessionUrl = databaseUrl.replace(':6543/postgres?pgbouncer=true', ':5432/postgres');
  await testPooler(sessionUrl, "Session Pooler (5432)");
}

run();
