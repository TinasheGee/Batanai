console.log('✅ user.routes.js loaded');

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET USER PROFILE (ME)
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = (req.user.role || '').toLowerCase();

    if (role === 'business') {
      // Fetch business profile
      const bRes = await pool.query(
        `SELECT id, name, email, phone, category, description, is_active, is_verified, created_at FROM businesses WHERE id=$1`,
        [userId]
      );
      if (bRes.rows.length === 0)
        return res.status(404).json({ error: 'Business not found' });
      const biz = bRes.rows[0];
      // Normalize fields to match frontend expectations
      const userObj = {
        id: biz.id,
        full_name: biz.name || '',
        email: biz.email,
        role: 'BUSINESS',
        phone: biz.phone || null,
        category: biz.category || null,
        description: biz.description || null,
        is_active: biz.is_active,
        is_verified: biz.is_verified,
        created_at: biz.created_at,
      };
      userObj.profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj.full_name)}&background=random&color=fff&rounded=true`;
      return res.json(userObj);
    }

    // Default: regular users
    const userResult = await pool.query(
      `SELECT users.id, users.full_name, users.email, users.role, businesses.name as business_name 
       FROM users 
       LEFT JOIN businesses ON users.id = businesses.owner_id 
       WHERE users.id=$1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    // Generate avatar based on name
    user.profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random&color=fff&rounded=true`;

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE USER PROFILE
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email } = req.body;

    const updateQuery = `
      UPDATE users 
      SET full_name = COALESCE($1, full_name), 
          email = COALESCE($2, email) 
      WHERE id = $3 
      RETURNING id, full_name, email, role`;

    const updatedUser = await pool.query(updateQuery, [
      full_name,
      email,
      userId,
    ]);

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// CHANGE PASSWORD
router.put('/change-password', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get current user password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id=$1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [
      newPasswordHash,
      userId,
    ]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET USER DASHBOARD
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ User's reviews
    const reviewsResult = await pool.query(
      'SELECT r.*, b.name AS business_name, p.name AS product_name FROM reviews r LEFT JOIN businesses b ON r.business_id=b.id LEFT JOIN products p ON r.product_id=p.id WHERE r.user_id=$1 ORDER BY r.created_at DESC',
      [userId]
    );

    // 2️⃣ User's businesses
    const businessesResult = await pool.query(
      'SELECT * FROM businesses WHERE owner_id=$1 ORDER BY created_at DESC',
      [userId]
    );

    // 3️⃣ Products submitted by this user
    const submissionsResult = await pool.query(
      'SELECT * FROM product_submissions WHERE submitted_by=$1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      reviews: reviewsResult.rows,
      businesses: businessesResult.rows,
      submissions: submissionsResult.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
