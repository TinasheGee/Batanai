const pool = require('./db');

// Haversine formula to calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Generate random coordinates within maxDistanceKm from center point
function generateRandomCoordinatesWithinRange(
  centerLat,
  centerLng,
  maxDistanceKm
) {
  // Random distance between 10km and maxDistanceKm
  const randomDistance = Math.random() * (maxDistanceKm - 10) + 10;

  // Random angle in radians
  const randomAngle = Math.random() * 2 * Math.PI;

  // Earth radius in km
  const R = 6371;

  // Angular distance in radians
  const angularDistance = randomDistance / R;

  // Convert center to radians
  const lat1 = deg2rad(centerLat);
  const lng1 = deg2rad(centerLng);

  // Calculate new point
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

  // Convert back to degrees
  return {
    lat: parseFloat(((lat2 * 180) / Math.PI).toFixed(6)),
    lng: parseFloat(((lng2 * 180) / Math.PI).toFixed(6)),
  };
}

async function updateBusinessCoordinates() {
  console.log('🚀 Starting business coordinates update...\n');

  // Reference point: Harare city center
  const HARARE_LAT = -17.8252;
  const HARARE_LNG = 31.0522;
  const MAX_DISTANCE_KM = 500;

  try {
    // Fetch all businesses
    const result = await pool.query(`
      SELECT id, name, location, latitude, longitude 
      FROM businesses 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY id
    `);

    const businesses = result.rows;
    console.log(`📍 Found ${businesses.length} businesses with coordinates\n`);

    let updatedCount = 0;
    let alreadyInRangeCount = 0;

    for (const business of businesses) {
      const distance = getDistanceFromLatLonInKm(
        HARARE_LAT,
        HARARE_LNG,
        parseFloat(business.latitude),
        parseFloat(business.longitude)
      );

      if (distance > MAX_DISTANCE_KM) {
        // Generate new coordinates within range
        const newCoords = generateRandomCoordinatesWithinRange(
          HARARE_LAT,
          HARARE_LNG,
          MAX_DISTANCE_KM
        );

        // Update the database
        await pool.query(
          `UPDATE businesses SET latitude = $1, longitude = $2 WHERE id = $3`,
          [newCoords.lat, newCoords.lng, business.id]
        );

        console.log(
          `✅ Updated: ${business.name}\n` +
            `   Old: [${business.latitude}, ${business.longitude}] (${distance.toFixed(1)}km)\n` +
            `   New: [${newCoords.lat}, ${newCoords.lng}] (${getDistanceFromLatLonInKm(HARARE_LAT, HARARE_LNG, newCoords.lat, newCoords.lng).toFixed(1)}km)\n`
        );
        updatedCount++;
      } else {
        console.log(
          `✓ ${business.name}: ${distance.toFixed(1)}km (already within range)`
        );
        alreadyInRangeCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Updated: ${updatedCount} businesses`);
    console.log(`  ✓ Already in range: ${alreadyInRangeCount} businesses`);
    console.log(
      `  📍 All businesses are now within ${MAX_DISTANCE_KM}km of Harare\n`
    );

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during update:', err);
    process.exit(1);
  }
}

updateBusinessCoordinates();
