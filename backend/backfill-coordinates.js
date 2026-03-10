const pool = require('./db');
const https = require('https');

/**
 * Geocode a location string to latitude/longitude using Nominatim (OpenStreetMap)
 * @param {string} location - Location string to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if failed
 */
function geocodeLocation(location) {
  return new Promise((resolve) => {
    if (!location || location.trim() === '') {
      resolve(null);
      return;
    }

    // Add "Zimbabwe" to the query to bias results towards Zimbabwe
    const query = encodeURIComponent(`${location}, Zimbabwe`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const options = {
      headers: {
        'User-Agent': 'Batanai-Marketplace-App/1.0', // Required by Nominatim
      },
    };

    https
      .get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json && json.length > 0) {
              const lat = parseFloat(json[0].lat);
              const lng = parseFloat(json[0].lon);
              resolve({ lat, lng });
            } else {
              console.log(`  ❌ No geocoding results for: ${location}`);
              resolve(null);
            }
          } catch (err) {
            console.error(
              `  ❌ Error parsing geocoding response:`,
              err.message
            );
            resolve(null);
          }
        });
      })
      .on('error', (err) => {
        console.error(`  ❌ Geocoding request error:`, err.message);
        resolve(null);
      });
  });
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main backfill function
 */
async function backfillBusinessCoordinates() {
  console.log('🚀 Starting business coordinates backfill...\n');

  try {
    // Fetch all businesses that have a location but no coordinates
    const result = await pool.query(`
      SELECT id, name, location 
      FROM businesses 
      WHERE location IS NOT NULL 
        AND location != '' 
        AND (latitude IS NULL OR longitude IS NULL)
      ORDER BY id
    `);

    const businesses = result.rows;
    console.log(`📍 Found ${businesses.length} businesses to geocode\n`);

    if (businesses.length === 0) {
      console.log('✅ All businesses already have coordinates!\n');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      console.log(
        `[${i + 1}/${businesses.length}] Processing: ${business.name} (${business.location})`
      );

      // Geocode the location
      const coords = await geocodeLocation(business.location);

      if (coords) {
        // Update the database
        await pool.query(
          `UPDATE businesses SET latitude = $1, longitude = $2 WHERE id = $3`,
          [coords.lat, coords.lng, business.id]
        );
        console.log(
          `  ✅ Updated: ${business.name} → [${coords.lat}, ${coords.lng}]`
        );
        successCount++;
      } else {
        console.log(`  ❌ Failed to geocode: ${business.name}`);
        failCount++;
      }

      // Respect Nominatim's usage policy: max 1 request per second
      if (i < businesses.length - 1) {
        await sleep(1100); // 1.1 seconds between requests
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Successfully geocoded: ${successCount}`);
    console.log(`  ❌ Failed to geocode: ${failCount}`);
    console.log('\n🎉 Backfill complete!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during backfill:', err);
    process.exit(1);
  }
}

// Run the backfill
backfillBusinessCoordinates();
