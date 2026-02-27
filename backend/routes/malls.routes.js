console.log('✅ malls.routes.js loaded');

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/malls - list malls (public)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query =
      'SELECT id, name, address, city, latitude, longitude, created_at FROM malls';
    const values = [];
    if (q) {
      query += ' WHERE name ILIKE $1';
      values.push(`%${q}%`);
    }
    query += ' ORDER BY name ASC';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to list malls:', err.message);
    res.status(500).json({ error: 'Failed to list malls' });
  }
});

// GET /api/malls/:id - single mall
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      'SELECT id, name, address, city, latitude, longitude, created_at FROM malls WHERE id=$1',
      [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Mall not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to get mall:', err.message);
    res.status(500).json({ error: 'Failed to get mall' });
  }
});

// POST /api/malls - create mall (admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const { name, address, city, latitude, longitude } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Avoid duplicates (case-insensitive)
    const existing = await pool.query(
      'SELECT id FROM malls WHERE LOWER(name)=LOWER($1)',
      [name]
    );
    if (existing.rows.length)
      return res.status(400).json({ error: 'Mall already exists' });

    const result = await pool.query(
      `INSERT INTO malls (name, address, city, latitude, longitude) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, address || null, city || null, latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create mall:', err.message);
    res.status(500).json({ error: 'Failed to create mall' });
  }
});

// PUT /api/malls/:id - update mall (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const id = req.params.id;
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    if (!fields.length)
      return res.status(400).json({ error: 'No fields provided' });
    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');
    const result = await pool.query(
      `UPDATE malls SET ${setQuery} WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Mall not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Failed to update mall:', err.message);
    res.status(500).json({ error: 'Failed to update mall' });
  }
});

// DELETE /api/malls/:id - delete mall (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const id = req.params.id;
    // Optional: check for businesses in mall and prevent delete if exists
    const bizCheck = await pool.query(
      'SELECT COUNT(*) AS cnt FROM businesses WHERE mall_id=$1',
      [id]
    );
    if (parseInt(bizCheck.rows[0].cnt) > 0) {
      return res
        .status(400)
        .json({ error: 'Cannot delete mall with assigned businesses' });
    }
    const result = await pool.query(
      'DELETE FROM malls WHERE id=$1 RETURNING *',
      [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: 'Mall not found' });
    res.json({ message: 'Mall deleted', mall: result.rows[0] });
  } catch (err) {
    console.error('Failed to delete mall:', err.message);
    res.status(500).json({ error: 'Failed to delete mall' });
  }
});

module.exports = router;
