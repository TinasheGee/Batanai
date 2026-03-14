console.log('admin.routes.js loaded');

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

/* =========================
   ADMIN-ONLY MIDDLEWARE
========================= */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
};

/* =========================
   GET ALL USERS (ADMIN)
   GET /api/admin/users
========================= */
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        full_name,
        email,
        role,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('ADMIN GET USERS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/* =========================
   GET ALL UNVERIFIED BUSINESSES
   GET /api/admin//unverified
========================= */
router.get('/businesses/unverified', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM businesses WHERE is_verified = false'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('ADMIN GET BUSINESSES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch unverified businesses' });
  }
});

/* =========================
   VERIFY A BUSINESS
   PATCH /api/admin/businesses/:id/verify
========================= */
router.patch('/businesses/:id/verify', auth, adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE businesses SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      message: 'Business verified',
      business: result.rows[0],
    });
  } catch (err) {
    console.error('ADMIN VERIFY ERROR:', err.message);
    res.status(500).json({ error: 'Failed to verify business' });
  }
});

module.exports = router;

// Site settings endpoints
router.get('/site-settings', auth, adminOnly, async (req, res) => {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      )
    `);

    const r = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    r.rows.forEach((row) => (settings[row.key] = row.value));
    res.json(settings);
  } catch (err) {
    console.error('GET site-settings error', err.message);
    res.status(500).json({ error: 'Failed to load site settings' });
  }
});

// Public site settings (read-only) - for customers & guests
router.get('/public/site-settings', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      )
    `);

    const r = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    r.rows.forEach((row) => (settings[row.key] = row.value));
    res.json(settings);
  } catch (err) {
    console.error('GET public site-settings error', err.message);
    res.status(500).json({ error: 'Failed to load site settings' });
  }
});

router.patch('/site-settings', auth, adminOnly, async (req, res) => {
  try {
    const updates = req.body || {};
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      )
    `);

    // Upsert each key
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO site_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }

    const r = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    r.rows.forEach((row) => (settings[row.key] = row.value));
    res.json(settings);
  } catch (err) {
    console.error('PATCH site-settings error', err.message);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
});

// Simple stats endpoint for admin dashboard
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const usersR = await pool.query('SELECT COUNT(*) FROM users');
    const businessesR = await pool.query('SELECT COUNT(*) FROM businesses');
    const productsR = await pool.query('SELECT COUNT(*) FROM products');

    res.json({
      users: Number(usersR.rows[0].count || 0),
      businesses: Number(businessesR.rows[0].count || 0),
      products: Number(productsR.rows[0].count || 0),
    });
  } catch (err) {
    console.error('ADMIN STATS ERROR', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
