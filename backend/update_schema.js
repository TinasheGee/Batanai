const pool = require('./.db_temp_migration.js');

(async () => {
  try {
    console.log('🔄 Running migrations...');
    await pool.query(
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)'
    );
    await pool.query(
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50)'
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
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mall_id INTEGER'
    );

    // ensure malls has is_verified (some older installs may lack this column)
    await pool.query(
      'ALTER TABLE malls ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE'
    );
    // add is_active to malls for enable/disable control
    await pool.query(
      'ALTER TABLE malls ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE'
    );

    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_businesses_mall_id ON businesses(mall_id)'
    );
    // add missing columns used by newer code
    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone VARCHAR(50)'
    );
    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP'
    );
    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC'
    );
    // ensure password_hash exists for business registrations
    await pool.query(
      'ALTER TABLE businesses ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)'
    );
    // Add attachment JSON column to messages so we can persist product snapshots
    await pool.query(
      'ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment JSONB'
    );
    await pool.query(
      'ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50)'
    );
    // add upvotes/downvotes counts to reviews
    await pool.query(
      'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0'
    );
    await pool.query(
      'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS downvotes_count INTEGER DEFAULT 0'
    );

    // add user preference: skip_unit_warning
    await pool.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS skip_unit_warning BOOLEAN DEFAULT FALSE'
    );

    // Create review_votes table to persist upvotes/downvotes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_votes (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote INTEGER NOT NULL CHECK (vote IN (1, -1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (review_id, user_id)
      )
    `);
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id)'
    );
    console.log('✅ Schema updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
