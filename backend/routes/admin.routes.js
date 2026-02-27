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
