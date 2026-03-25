const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Make sure your db.js is set up
const router = express.Router();

// Allowed roles matching your DB constraint
const allowedRoles = ['customer', 'business', 'admin'];

// ------------------------
// TEST ROUTES
// ------------------------
router.get('/hello', (req, res) => {
  res.send('Auth route is working!');
});

router.post('/test-post', (req, res) => {
  console.log('POST request received:', req.body);
  res.json({ message: 'POST route works!' });
});

// ------------------------
// REGISTER ROUTE
// ------------------------
router.post('/register', async (req, res) => {
  const { role, full_name, email, password } = req.body;

  // 1️⃣ Validate input
  if (!role || !full_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      error: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`,
    });
  }

  try {
    // 2️⃣ Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 3️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4️⃣ Insert user
    const newUser = await pool.query(
      `INSERT INTO users (role, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, role, email`,
      [role, full_name, email, password_hash]
    );

    res.status(201).json({
      message: 'User registered',
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------------
// LOGIN ROUTE
// ------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`🔐 Login attempt for: ${email}`);

  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // If not found in users table, try businesses table (business accounts)
      const bizResult = await pool.query(
        'SELECT * FROM businesses WHERE email = $1',
        [email]
      );
      if (bizResult.rows.length === 0) {
        console.log('❌ User not found in users or businesses table');
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const biz = bizResult.rows[0];
      const isBizMatch = await bcrypt.compare(password, biz.password_hash);
      if (!isBizMatch) {
        console.log('❌ Business password mismatch');
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Ensure business is active and verified
      if (biz.is_active === false) {
        console.log('❌ Business account is inactive');
        return res.status(403).json({ error: 'Business account is inactive' });
      }

      if (biz.is_verified === false) {
        console.log('❌ Business account is not verified');
        return res
          .status(403)
          .json({ error: 'Business account is not verified' });
      }

      console.log(`✅ Login successful for business ID: ${biz.id}`);
      const token = jwt.sign(
        { id: biz.id, role: 'business' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: biz.id,
          role: 'business',
          email: biz.email,
          name: biz.name,
        },
      });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ Login successful for user ID: ${user.id} (${user.role})`);
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
