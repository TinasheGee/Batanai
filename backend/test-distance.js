const pool = require('./db');

// Test the distance calculation with sample data
async function testDistanceCalculation() {
  const userLat = -17.8252; // Harare
  const userLng = 31.0522;

  console.log('\n🧪 Testing distance calculation from Harare:');
  console.log(`   User location: [${userLat}, ${userLng}]\n`);

  try {
    const query = `
      SELECT 
        b.id,
        b.name,
        b.latitude,
        b.longitude,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(b.latitude)) * 
            cos(radians(b.longitude) - radians($2)) + 
            sin(radians($1)) * sin(radians(b.latitude))
          )
        ) AS distance
      FROM businesses b
      WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL
      ORDER BY distance
      LIMIT 10
    `;

    const result = await pool.query(query, [userLat, userLng]);

    console.log('📍 Top 10 closest businesses:\n');
    result.rows.forEach((row) => {
      console.log(`   ${row.name}: ${parseFloat(row.distance).toFixed(1)}km`);
      console.log(`      Coordinates: [${row.latitude}, ${row.longitude}]`);
    });

    console.log('\n✅ Test complete\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testDistanceCalculation();
