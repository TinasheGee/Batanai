const pool = require('./.db_temp_migration.js');

(async () => {
  try {
    console.log('🔄 Running migrations...');
    await pool.query(
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)'
    );
    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)'
    );
    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)'
    );
    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)'
    );
    // Create malls table and add mall_id to businesses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS malls (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        address TEXT,
        city VARCHAR(100),
        latitude NUMERIC(10,6),
        longitude NUMERIC(10,6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mall_id INTEGER'
    );

    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_businesses_mall_id ON businesses(mall_id)'
    );
    console.log('✅ Schema updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
