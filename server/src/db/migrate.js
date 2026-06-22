// Applies schema.sql to the database pointed to by DATABASE_URL.
// Run with: npm run migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('\n✗ DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.\n');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Applying schema to database…');
  try {
    await pool.query(sql);
    console.log('✓ Migration complete. Tables: documents, chunks (with pgvector).');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    if (/extension "vector"/.test(err.message)) {
      console.error('  → Your Postgres lacks pgvector. Use Neon/Supabase, or install the pgvector extension.');
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
