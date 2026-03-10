const pool = require('./db');

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

async function verifyBusinessDistances() {
  const HARARE_LAT = -17.8252;
  const HARARE_LNG = 31.0522;

  try {
    const result = await pool.query(`
      SELECT id, name, location, latitude, longitude 
      FROM businesses 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY id
    `);

    console.log('\n📍 Business distances from Harare:\n');

    let maxDistance = 0;
    let maxDistanceBusiness = null;

    result.rows.forEach((business) => {
      const distance = getDistanceFromLatLonInKm(
        HARARE_LAT,
        HARARE_LNG,
        parseFloat(business.latitude),
        parseFloat(business.longitude)
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        maxDistanceBusiness = business.name;
      }

      const status = distance <= 500 ? '✅' : '❌';
      console.log(`${status} ${business.name}: ${distance.toFixed(1)}km`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`  Total businesses: ${result.rows.length}`);
    console.log(
      `  Farthest business: ${maxDistanceBusiness} (${maxDistance.toFixed(1)}km)`
    );
    console.log(
      `  All within 500km: ${maxDistance <= 500 ? '✅ YES' : '❌ NO'}\n`
    );

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

verifyBusinessDistances();
