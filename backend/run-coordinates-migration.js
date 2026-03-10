const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Running migration: add_business_coordinates.sql\n');

  try {
    const migrationPath = path.join(
      __dirname,
      'migrations',
      'add_business_coordinates.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('📍 Added latitude and longitude columns to businesses table');
    console.log('📍 Created indexes for better query performance\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
