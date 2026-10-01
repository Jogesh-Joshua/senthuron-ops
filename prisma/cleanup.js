const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // First list tables to find the correct names
  const tables = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  console.log('Tables:', tables.rows.map(r => r.tablename).join(', '));

  // Delete test enquiries (cascade via FK removes enquiry_activities)
  const result = await pool.query(
    "DELETE FROM enquiries WHERE lower(\"clientName\") LIKE '%test%' RETURNING id, \"clientName\""
  );
  console.log('Deleted:', result.rowCount, 'enquiry(ies):',
    result.rows.map(r => r.clientName).join(', ') || 'none');
}

main()
  .catch(e => console.error('Error:', e.message))
  .finally(() => pool.end());
