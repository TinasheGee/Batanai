const pool = require('./db');
require('dotenv').config();

function slugify(name) {
  return name
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function randomSix() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function seedContacts() {
  try {
    const res = await pool.query(
      'SELECT id, name, email, phone_number, website, location FROM businesses'
    );
    const businesses = res.rows;
    console.log(`Found ${businesses.length} businesses`);

    let updated = 0;
    for (const b of businesses) {
      const updates = {};
      if (!b.email) {
        updates.email = `contact+${b.id}@batanai.co.zw`;
      }
      if (!b.phone_number) {
        updates.phone_number = `+263 77 ${randomSix()}`;
      }
      if (!b.website) {
        const slug = b.name ? slugify(b.name) : `business-${b.id}`;
        updates.website = `www.${slug}.co.zw`;
      }
      if (!b.location) {
        updates.location = 'Harare, Zimbabwe';
      }

      const keys = Object.keys(updates);
      if (keys.length === 0) continue;

      const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = keys.map((k) => updates[k]);
      values.push(b.id);

      const sql = `UPDATE businesses SET ${sets} WHERE id = $${keys.length + 1}`;
      await pool.query(sql, values);
      updated++;
      console.log(
        `Updated business ${b.id} (${b.name}) with: ${JSON.stringify(updates)}`
      );
    }

    console.log(`Seeding complete. Updated ${updated} businesses.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed business contacts', err);
    process.exit(1);
  }
}

seedContacts();
