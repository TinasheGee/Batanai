const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /network - Get my network data
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get followed businesses
    const following = await pool.query(
      `
      SELECT b.*, f.created_at as followed_at 
      FROM businesses b
      JOIN follows f ON b.id = f.business_id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
    `,
      [userId]
    );

    // 2. Get suggested businesses (based on shared interests or just random for now)
    const suggestions = await pool.query(
      `
      SELECT * FROM businesses 
      WHERE id NOT IN (SELECT business_id FROM follows WHERE follower_id = $1)
      ORDER BY RANDOM()
      LIMIT 6
    `,
      [userId]
    );

    // 3. Get similar people (users with same interests)
    const similarPeople = await pool.query(
      `
        SELECT DISTINCT u.id, u.full_name, u.email, u.role
        FROM users u
        JOIN user_interests ui ON u.id = ui.user_id
        WHERE ui.interest_id IN (
            SELECT interest_id FROM user_interests WHERE user_id = $1
        )
        AND u.id != $1
        LIMIT 6
    `,
      [userId]
    );

    // Add avatar to similar people
    const peopleWithAvatars = similarPeople.rows.map((user) => ({
      ...user,
      profile_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random&color=fff&rounded=true`,
    }));

    // 4. Get followers (Users following MY businesses)
    const followers = await pool.query(
      `
      SELECT u.id, u.full_name, u.email, u.role, f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      JOIN businesses b ON f.business_id = b.id
      WHERE b.owner_id = $1
      ORDER BY f.created_at DESC
      `,
      [userId]
    );
    
    // Add avatar
    const followersWithAvatars = followers.rows.map((user) => ({
      ...user,
      profile_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random&color=fff&rounded=true`,
    }));

    res.json({
      following: following.rows,
      followedBy: followersWithAvatars,
      suggestions: suggestions.rows,
      people: peopleWithAvatars,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /network/follow/:id
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const businessId = req.params.id;

    await pool.query(
      'INSERT INTO follows (follower_id, business_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, businessId]
    );
    res.json({ message: 'Followed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /network/follow/:id
router.delete('/follow/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const businessId = req.params.id;

    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND business_id = $2',
      [userId, businessId]
    );
    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
