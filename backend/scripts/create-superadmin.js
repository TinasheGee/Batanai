const pool = require('../db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function ensureAdmin() {
  try {
    const res = await pool.query(
      "SELECT id FROM users WHERE role='admin' LIMIT 1"
    );
    if (res.rows.length > 0) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@batanai.local';
    const password = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!';
    const fullName = process.env.SUPERADMIN_NAME || 'Super Admin';

    const hash = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      `INSERT INTO users (role, full_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['admin', fullName, email, hash]
    );

    console.log('Created super admin:', { id: insert.rows[0].id, email });
    console.log('Please change the password immediately.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create superadmin', err.message);
    process.exit(1);
  }
}

ensureAdmin();
