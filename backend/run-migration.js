require('dotenv').config();
const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const sqlPath = path.join(__dirname, 'migrations', 'add_review_seconds.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('Running migration: add_review_seconds.sql');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
