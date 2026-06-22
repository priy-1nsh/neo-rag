const { Pool } = require('pg');

// SSL handling mirrors the Soundwave app:
//  - Local Postgres: no SSL.
//  - Managed Postgres (Neon, Supabase, Railway, Heroku): SSL on.
//  - DATABASE_SSL is an explicit override ('true' / 'false') when the guess is wrong.
function sslConfig() {
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (process.env.DATABASE_SSL === 'false') return false;
  // Neon and most managed providers require SSL even in development.
  if (process.env.DATABASE_URL && /neon\.tech|supabase|render|railway|heroku|sslmode=require/.test(process.env.DATABASE_URL)) {
    return { rejectUnauthorized: false };
  }
  return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function assertConfigured() {
  if (!process.env.DATABASE_URL) {
    const err = new Error(
      'Database not configured. Add DATABASE_URL to server/.env (e.g. a free Neon connection string) and run `npm run migrate`.'
    );
    err.status = 503;
    throw err;
  }
}

module.exports = {
  query: (text, params) => {
    assertConfigured();
    return pool.query(text, params);
  },
  withTransaction: (callback) => {
    assertConfigured();
    return withTransaction(callback);
  },
  pool,
};
