const pool = require('./db');

async function checkBusinesses() {
  try {
    const result = await pool.query(`
      SELECT id, name, location, latitude, longitude 
      FROM businesses 
      ORDER BY id 
      LIMIT 20
    `);

    console.log('\n📊 Current businesses in database:\n');
    if (result.rows.length === 0) {
      console.log('❌ No businesses found in the database\n');
    } else {
      console.table(result.rows);
      console.log(`\nTotal: ${result.rows.length} businesses shown (max 20)\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking businesses:', err);
    process.exit(1);
  }
}

checkBusinesses();
