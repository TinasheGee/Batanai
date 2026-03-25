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
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const search = (req.query.search || '').trim();

    const where = search
      ? `WHERE LOWER(email) LIKE $1 OR LOWER(full_name) LIKE $1`
      : '';
    const params = [];
    if (search) params.push(`%${search.toLowerCase()}%`);

    const offset = (page - 1) * pageSize;

    const totalRes = await pool.query(
      `SELECT COUNT(*) as count FROM users ${where}`,
      params
    );
    const total = parseInt(totalRes.rows[0].count, 10);

    const result = await pool.query(
      `SELECT id, full_name, email, role, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    res.json({ rows: result.rows, total });
  } catch (err) {
    console.error('ADMIN GET USERS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/* =========================
   PATCH CHANGE USER ROLE
   PATCH /api/admin/users/:id/role
========================= */
router.patch('/users/:id/role', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    if (!role) return res.status(400).json({ error: 'Role required' });
    const allowed = ['customer', 'business', 'admin'];
    if (!allowed.includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const result = await pool.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, full_name, email, role',
      [role, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH user role error', err.message);
    res.status(500).json({ error: 'Failed to change user role' });
  }
});

/* =========================
   DELETE USER
   DELETE /api/admin/users/:id
========================= */
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('DELETE user error', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
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
   GET ALL BUSINESSES (ADMIN)
   GET /api/admin/businesses
   Supports pagination: ?page=&pageSize=&search=
========================= */
router.get('/businesses', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const search = (req.query.search || '').trim();

    const where = search
      ? `WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1`
      : '';
    const params = [];
    if (search) params.push(`%${search.toLowerCase()}%`);

    const offset = (page - 1) * pageSize;

    const totalRes = await pool.query(
      `SELECT COUNT(*) as count FROM businesses ${where}`,
      params
    );
    const total = parseInt(totalRes.rows[0].count, 10);

    const r = await pool.query(
      `SELECT id, name, email, phone, category, mall_id, is_active, is_verified, created_at FROM businesses ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );
    res.json({ rows: r.rows, total });
  } catch (err) {
    console.error('ADMIN GET BUSINESSES ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

/* =========================
   CREATE BUSINESS (ADMIN)
   POST /api/admin/businesses
========================= */
router.post('/businesses', auth, adminOnly, async (req, res) => {
  const {
    name,
    email,
    phone,
    category,
    description,
    mall_id,
    is_verified,
    is_active,
  } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: 'Name and email required' });
  try {
    const r = await pool.query(
      `INSERT INTO businesses (name, email, phone, category, description, mall_id, is_verified, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7, true), COALESCE($8, true)) RETURNING *`,
      [
        name,
        email,
        phone || null,
        category || null,
        description || null,
        mall_id || null,
        is_verified,
        is_active,
      ]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('ADMIN CREATE BUSINESS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

/* =========================
   UPDATE BUSINESS
   PATCH /api/admin/businesses/:id
========================= */
router.patch('/businesses/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    category,
    description,
    mall_id,
    is_verified,
    is_active,
  } = req.body;
  try {
    const r = await pool.query(
      `UPDATE businesses SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         category = COALESCE($4, category),
         description = COALESCE($5, description),
         mall_id = COALESCE($6, mall_id),
         is_verified = COALESCE($7, is_verified),
         is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [
        name,
        email,
        phone,
        category,
        description,
        mall_id,
        is_verified,
        is_active,
        id,
      ]
    );
    if (r.rows.length === 0)
      return res.status(404).json({ error: 'Business not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('ADMIN UPDATE BUSINESS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

/* =========================
   DELETE BUSINESS
   DELETE /api/admin/businesses/:id
========================= */
router.delete('/businesses/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM businesses WHERE id = $1', [id]);
    res.json({ message: 'Business deleted' });
  } catch (err) {
    console.error('ADMIN DELETE BUSINESS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

/* =========================
   GET ALL PRODUCTS (ADMIN)
   GET /api/admin/products
========================= */
router.get('/products', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const search = (req.query.search || '').trim();

    const where = search ? `WHERE LOWER(name) LIKE $1` : '';
    const params = [];
    if (search) params.push(`%${search.toLowerCase()}%`);
    const offset = (page - 1) * pageSize;

    const totalRes = await pool.query(
      `SELECT COUNT(*) as count FROM products ${where}`,
      params
    );
    const total = parseInt(totalRes.rows[0].count, 10);

    const r = await pool.query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );
    res.json({ rows: r.rows, total });
  } catch (err) {
    console.error('ADMIN GET PRODUCTS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/* =========================
   CREATE PRODUCT
   POST /api/admin/products
========================= */
router.post('/products', auth, adminOnly, async (req, res) => {
  const { name, description, price, business_id } = req.body;
  if (!name || !business_id)
    return res.status(400).json({ error: 'Name and business_id required' });
  try {
    const r = await pool.query(
      `INSERT INTO products (name, description, price, business_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, description || null, price || 0, business_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('ADMIN CREATE PRODUCT ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/* =========================
   UPDATE PRODUCT
   PATCH /api/admin/products/:id
========================= */
router.patch('/products/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    const r = await pool.query(
      `UPDATE products SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         price = COALESCE($3, price)
       WHERE id = $4 RETURNING *`,
      [name, description, price, id]
    );
    if (r.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('ADMIN UPDATE PRODUCT ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/* =========================
   DELETE PRODUCT
   DELETE /api/admin/products/:id
========================= */
router.delete('/products/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('ADMIN DELETE PRODUCT ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/* =========================
   GET UNVERIFIED MALLS
   GET /api/admin/malls/unverified
========================= */
router.get('/malls/unverified', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM malls WHERE is_verified = false');
    res.json(r.rows);
  } catch (err) {
    console.error('ADMIN GET MALLS ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch unverified malls' });
  }
});

/* =========================
   GET ALL MALLS (ADMIN)
   GET /api/admin/malls
========================= */
router.get('/malls', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 25;
    const search = (req.query.search || '').trim();

    const where = search
      ? `WHERE LOWER(name) LIKE $1 OR LOWER(city) LIKE $1`
      : '';
    const params = [];
    if (search) params.push(`%${search.toLowerCase()}%`);
    const offset = (page - 1) * pageSize;

    const totalRes = await pool.query(
      `SELECT COUNT(*) as count FROM malls ${where}`,
      params
    );
    const total = parseInt(totalRes.rows[0].count, 10);

    const r = await pool.query(
      `SELECT * FROM malls ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );
    res.json({ rows: r.rows, total });
  } catch (err) {
    console.error('ADMIN GET MALLS ALL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to fetch malls' });
  }
});

/* =========================
   CREATE A MALL
   POST /api/admin/malls
========================= */
router.post('/malls', auth, adminOnly, async (req, res) => {
  const { name, address, city, latitude, longitude } = req.body;
  if (!name) return res.status(400).json({ error: 'Mall name required' });
  try {
    const r = await pool.query(
      `INSERT INTO malls (name, address, city, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, address || null, city || null, latitude || null, longitude || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('ADMIN CREATE MALL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create mall' });
  }
});

/* =========================
   UPDATE A MALL
   PATCH /api/admin/malls/:id
========================= */
router.patch('/malls/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, address, city, latitude, longitude, is_verified, is_active } =
    req.body;
  try {
    const r = await pool.query(
      `UPDATE malls SET
         name = COALESCE($1, name),
         address = COALESCE($2, address),
         city = COALESCE($3, city),
         latitude = COALESCE($4, latitude),
         longitude = COALESCE($5, longitude),
         is_verified = COALESCE($6, is_verified),
         is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING *`,
      [name, address, city, latitude, longitude, is_verified, is_active, id]
    );
    if (r.rows.length === 0)
      return res.status(404).json({ error: 'Mall not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('ADMIN UPDATE MALL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to update mall' });
  }
});

/* =========================
   DELETE A MALL
   DELETE /api/admin/malls/:id
========================= */
router.delete('/malls/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM malls WHERE id = $1', [id]);
    res.json({ message: 'Mall deleted' });
  } catch (err) {
    console.error('ADMIN DELETE MALL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to delete mall' });
  }
});

/* =========================
   VERIFY A MALL
   PATCH /api/admin/malls/:id/verify
   Sets mall is_verified=true and activates any businesses in that mall
========================= */
router.patch('/malls/:id/verify', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const mallR = await pool.query(
      'UPDATE malls SET is_verified = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (mallR.rows.length === 0)
      return res.status(404).json({ error: 'Mall not found' });

    // Activate businesses in this mall
    await pool.query(
      'UPDATE businesses SET is_active = true WHERE mall_id = $1',
      [id]
    );

    res.json({
      message: 'Mall verified and businesses activated',
      mall: mallR.rows[0],
    });
  } catch (err) {
    console.error('ADMIN VERIFY MALL ERROR:', err.message);
    res.status(500).json({ error: 'Failed to verify mall' });
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
      'UPDATE businesses SET is_verified = true, is_active = true WHERE id = $1 RETURNING *',
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
