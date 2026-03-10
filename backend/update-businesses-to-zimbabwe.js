const pool = require('./db');

// Zimbabwe geographic bounds
const ZIMBABWE_BOUNDS = {
  minLat: -23,
  maxLat: -15,
  minLng: 25,
  maxLng: 34,
};

// Harare as default center
const HARARE_CENTER = {
  lat: -17.8252,
  lng: 31.0522,
};

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

function generateRandomCoordinatesInZimbabwe() {
  // Generate coordinates within 400km of Harare (staying within Zimbabwe)
  const maxDistanceKm = 400;
  const randomDistance = Math.random() * (maxDistanceKm - 10) + 10;
  const randomAngle = Math.random() * 2 * Math.PI;
  const R = 6371;
  const angularDistance = randomDistance / R;
  const lat1 = deg2rad(HARARE_CENTER.lat);
  const lng1 = deg2rad(HARARE_CENTER.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(randomAngle)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(randomAngle) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: parseFloat(((lat2 * 180) / Math.PI).toFixed(6)),
    lng: parseFloat(((lng2 * 180) / Math.PI).toFixed(6)),
  };
}

async function updateBusinessesOutsideZimbabwe() {
  console.log('🚀 Checking for businesses outside Zimbabwe...\n');

  try {
    const result = await pool.query(`
      SELECT id, name, location, latitude, longitude 
      FROM businesses 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY id
    `);

    const businesses = result.rows;
    console.log(`📍 Found ${businesses.length} businesses with coordinates\n`);

    let outsideCount = 0;
    let insideCount = 0;
    const outsideBusinesses = [];

    // First, identify businesses outside Zimbabwe
    for (const business of businesses) {
      const lat = parseFloat(business.latitude);
      const lng = parseFloat(business.longitude);

      const isInZimbabwe =
        lat >= ZIMBABWE_BOUNDS.minLat &&
        lat <= ZIMBABWE_BOUNDS.maxLat &&
        lng >= ZIMBABWE_BOUNDS.minLng &&
        lng <= ZIMBABWE_BOUNDS.maxLng;

      if (!isInZimbabwe) {
        outsideBusinesses.push(business);
        console.log(`❌ Outside Zimbabwe: ${business.name}`);
        console.log(`   Current: [${lat}, ${lng}]`);
        outsideCount++;
      } else {
        insideCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Inside Zimbabwe: ${insideCount}`);
    console.log(`   ❌ Outside Zimbabwe: ${outsideCount}\n`);

    if (outsideCount === 0) {
      console.log('✅ All businesses are already in Zimbabwe!\n');
      process.exit(0);
    }

    console.log('🔄 Updating businesses outside Zimbabwe...\n');

    let updatedCount = 0;
    for (const business of outsideBusinesses) {
      const newCoords = generateRandomCoordinatesInZimbabwe();

      await pool.query(
        `UPDATE businesses SET latitude = $1, longitude = $2 WHERE id = $3`,
        [newCoords.lat, newCoords.lng, business.id]
      );

      const distance = getDistanceFromLatLonInKm(
        HARARE_CENTER.lat,
        HARARE_CENTER.lng,
        newCoords.lat,
        newCoords.lng
      );

      console.log(`✅ Updated: ${business.name}`);
      console.log(`   Old: [${business.latitude}, ${business.longitude}]`);
      console.log(
        `   New: [${newCoords.lat}, ${newCoords.lng}] (${distance.toFixed(1)}km from Harare)\n`
      );
      updatedCount++;
    }

    console.log(
      `\n🎉 Complete! Updated ${updatedCount} businesses to Zimbabwe coordinates\n`
    );
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateBusinessesOutsideZimbabwe();
