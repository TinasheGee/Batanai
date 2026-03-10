const pool = require('./db');

async function checkProducts() {
  try {
    // Check how many products exist
    const countResult = await pool.query(`SELECT COUNT(*) FROM products`);
    console.log(
      `\n📊 Total products in database: ${countResult.rows[0].count}\n`
    );

    // Get sample products with business info
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.price,
        b.name as business_name, 
        b.location,
        b.latitude,
        b.longitude
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      ORDER BY p.id 
      LIMIT 10
    `);

    if (result.rows.length === 0) {
      console.log('❌ No products found in the database\n');
    } else {
      console.log('Sample products:\n');
      console.table(result.rows);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error checking products:', err);
    process.exit(1);
  }
}

checkProducts();
