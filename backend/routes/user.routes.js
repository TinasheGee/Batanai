console.log('✅ user.routes.js loaded');

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const upload = require('../upload');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, '..', 'uploads');

// GET USER PROFILE (ME)
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = (req.user.role || '').toLowerCase();

    if (role === 'business') {
      // Fetch business profile by owner_id (user id)
      const bRes = await pool.query(
        `SELECT id, name, email, phone, category, description, is_active, is_verified, created_at FROM businesses WHERE owner_id=$1`,
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
      // attach per-user preference if present
      try {
        const prefRes = await pool.query(
          'SELECT skip_unit_warning FROM users WHERE id=$1',
          [req.user.id]
        );
        userObj.skip_unit_warning = !!(
          prefRes.rows[0] && prefRes.rows[0].skip_unit_warning
        );
      } catch (e) {
        userObj.skip_unit_warning = false;
      }
      // prefer any uploaded profile image for this user
      try {
        const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
        const found = files.find((f) => f.startsWith(`user-${userId}`));
        if (found)
          userObj.profile_image = `${req.protocol}://${req.get('host')}/uploads/${found}`;
        else
          userObj.profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userObj.full_name
          )}&background=random&color=fff&rounded=true`;
      } catch (e) {
        userObj.profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          userObj.full_name
        )}&background=random&color=fff&rounded=true`;
      }
      return res.json(userObj);
    }

    // Default: regular users
    const userResult = await pool.query(
      `SELECT users.id, users.full_name, users.email, users.role, users.skip_unit_warning, businesses.name as business_name 
       FROM users 
       LEFT JOIN businesses ON users.id = businesses.owner_id 
       WHERE users.id=$1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    // Prefer an uploaded profile image if present, otherwise generate avatar based on name
    try {
      const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
      const found = files.find((f) => f.startsWith(`user-${userId}`));
      if (found)
        user.profile_image = `${req.protocol}://${req.get('host')}/uploads/${found}`;
      else
        user.profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.full_name
        )}&background=random&color=fff&rounded=true`;
    } catch (e) {
      user.profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.full_name
      )}&background=random&color=fff&rounded=true`;
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user preferences (e.g., skip unit warning)
router.put('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skipUnitWarning } = req.body;
    if (typeof skipUnitWarning === 'undefined') {
      return res
        .status(400)
        .json({ error: 'Missing skipUnitWarning in request body' });
    }
    await pool.query('UPDATE users SET skip_unit_warning=$1 WHERE id=$2', [
      !!skipUnitWarning,
      userId,
    ]);
    res.json({ skip_unit_warning: !!skipUnitWarning });
  } catch (err) {
    console.error('Failed to update preferences', err.message);
    res.status(500).json({ error: 'Failed to update preferences' });
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

// Upload profile image for current user
router.post(
  '/profile/image',
  auth,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const userId = req.user.id;
      const ext =
        path.extname(req.file.originalname) || path.extname(req.file.filename);
      const newName = `user-${userId}${ext}`;
      const oldPath = path.join(uploadDir, req.file.filename);
      const newPath = path.join(uploadDir, newName);

      // remove any previous user images
      try {
        const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
        files.forEach((f) => {
          if (f.startsWith(`user-${userId}`) && f !== newName) {
            try {
              fs.unlinkSync(path.join(uploadDir, f));
            } catch (e) {}
          }
        });
      } catch (e) {
        // ignore
      }

      // rename the uploaded file to a stable name
      fs.renameSync(oldPath, newPath);

      const imagePath = `${req.protocol}://${req.get('host')}/uploads/${newName}`;
      // we don't add a DB column; GET /me will prefer the uploaded file when present
      res.json({ profile_image: imagePath });
    } catch (err) {
      console.error('upload profile image error', err.message);
      res.status(500).json({ error: 'Failed to upload profile image' });
    }
  }
);

module.exports = router;

// DELETE profile image for current user
router.delete('/profile/image', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
    const userFiles = files.filter((f) => f.startsWith(`user-${userId}`));
    let deleted = 0;
    for (const f of userFiles) {
      try {
        fs.unlinkSync(path.join(uploadDir, f));
        deleted += 1;
      } catch (e) {
        // ignore individual errors
      }
    }
    res.json({ deleted });
  } catch (err) {
    console.error('delete profile image error', err.message);
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
});
