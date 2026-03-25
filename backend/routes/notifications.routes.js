const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/notifications - user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch notifications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications/mark-read/:id
router.post('/mark-read/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const update = await pool.query(
      'UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, userId]
    );
    if (!update.rows.length)
      return res.status(404).json({ error: 'Not found' });
    res.json(update.rows[0]);
  } catch (err) {
    console.error('Mark notification read error:', err.message);
    res.status(500).json({ error: 'Failed to mark notification' });
  }
});

module.exports = router;
