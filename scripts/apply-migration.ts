/**
 * Apply a SQL migration file to Supabase.
 * Uses the Supabase Management REST API (requires SUPABASE_ACCESS_TOKEN env var).
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<pat> npx tsx --tsconfig tsconfig.scripts.json scripts/apply-migration.ts <file>
 *
 * If you don't have a PAT, paste the SQL manually in:
 *   https://app.supabase.com/project/pxtsqrzkztkbsygcbois/sql/new
 */

import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const PROJECT_REF = 'pxtsqrzkztkbsygcbois';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('Usage: apply-migration.ts <sql-file>');
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), sqlFile);
if (!fs.existsSync(sqlPath)) {
  console.error(`File not found: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

if (!ACCESS_TOKEN) {
  console.log('');
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║  SUPABASE_ACCESS_TOKEN not set                              ║');
  console.log('╠═════════════════════════════════════════════════════════════╣');
  console.log('║  To apply this migration, paste the SQL below into:         ║');
  console.log('║  https://app.supabase.com/project/pxtsqrzkztkbsygcbois/sql/new  ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('─── SQL to run ───────────────────────────────────────────────');
  console.log(sql);
  process.exit(0);
}

async function apply() {
  console.log(`Applying migration: ${sqlFile}`);
  const resp = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!resp.ok) {
    const body = await resp.text();
    console.error(`❌ API error ${resp.status}: ${body}`);
    process.exit(1);
  }

  const result = await resp.json();
  console.log('✅ Migration applied successfully');
  console.log(result);
}

apply().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
