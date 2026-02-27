const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products/search
router.get('/search', async (req, res) => {
  try {
    const {
      search,
      min_price,
      max_price,
      sort_by,
      user_lat,
      user_lng,
      mall_id,
    } = req.query;

    let i = 1;

    let query = `
      SELECT 
        p.*,
        b.name as business_name,
        b.owner_id,
        b.logo_url,
        b.latitude,
        b.longitude,
        b.location,
        m.name AS mall_name,
        ${
          user_lat && user_lng
            ? `(
                6371 * acos(
                  cos(radians($${i})) * cos(radians(b.latitude)) * 
                  cos(radians(b.longitude) - radians($${i + 1})) + 
                  sin(radians($${i})) * sin(radians(b.latitude))
                )
              ) AS distance`
            : 'NULL AS distance'
        }
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      LEFT JOIN malls m ON b.mall_id = m.id
      WHERE 1=1
    `;

    const values = [];
    if (user_lat && user_lng) {
      values.push(user_lat, user_lng);
      i += 2;
    }

    if (search) {
      query += ` AND (p.name ILIKE $${i} OR p.description ILIKE $${i} OR b.name ILIKE $${i} OR p.image_url ILIKE $${i})`;
      values.push(`%${search}%`);
      i++;
    }

    if (min_price) {
      query += ` AND p.price >= $${i}`;
      values.push(min_price);
      i++;
    }

    if (max_price) {
      query += ` AND p.price <= $${i}`;
      values.push(max_price);
      i++;
    }

    if (mall_id) {
      query += ` AND b.mall_id = $${i}`;
      values.push(mall_id);
      i++;
    }

    // Sorting
    if (sort_by === 'lowest_price') {
      query += ` ORDER BY p.price ASC`;
    } else if (sort_by === 'highest_price') {
      query += ` ORDER BY p.price DESC`;
    } else if (sort_by === 'closest' && user_lat && user_lng) {
      query += ` ORDER BY distance ASC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
