const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
});

async function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  await pool.query(schema);
}

module.exports = { pool, initializeDatabase };
