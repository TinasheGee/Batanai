const pool = require('./db');
require('dotenv').config();

function slugify(name) {
  return (name || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function randomSix() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function updateAll() {
  try {
    const res = await pool.query('SELECT id, name FROM businesses ORDER BY id');
    const businesses = res.rows;
    console.log(`Found ${businesses.length} businesses`);

    let updated = 0;
    for (const b of businesses) {
      const slug = b.name ? slugify(b.name) : `business-${b.id}`;
      const email = `contact+${b.id}@${slug}.co.zw`;
      const phone_number = `+263 77 ${randomSix()}`;
      const website = `www.${slug}.co.zw`;
      const location = 'Harare, Zimbabwe';

      await pool.query(
        `UPDATE businesses SET email=$1, phone_number=$2, website=$3, location=$4 WHERE id=$5`,
        [email, phone_number, website, location, b.id]
      );
      updated++;
      if (updated % 10 === 0) console.log(`Updated ${updated} rows...`);
    }

    console.log(`Update complete. Updated ${updated} businesses.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to update businesses', err);
    process.exit(1);
  }
}

updateAll();
