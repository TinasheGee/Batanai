console.log('✅ business.routes.js loaded');

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const upload = require('../upload'); // adjust path if necessary
const bcrypt = require('bcryptjs');

/* =========================
   GET PROMOTIONS (SHOPS WITH PRODUCTS)
========================= */
router.get('/promotions', async (req, res) => {
  try {
    // Select businesses that have products, aggregating products into a JSON array
    const query = `
      SELECT 
        b.id,
        b.name AS business_name, 
        b.mall_id,
        m.name AS mall_name,
        b.logo_url,
        b.location,
        b.category,
        b.latitude,
        b.longitude,
        json_agg(p.*) AS products
      FROM businesses b
      JOIN products p ON b.id = p.business_id
      LEFT JOIN malls m ON b.mall_id = m.id
      GROUP BY b.id, b.category, b.mall_id, m.name
      ORDER BY RANDOM()
      LIMIT 20
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Promotions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

/* =========================
   GET AVAILABLE CATEGORIES
   Returns a sorted list of distinct categories found in businesses and products
========================= */
router.get('/categories', async (req, res) => {
  try {
    // Prefer structured categories table when available
    const rows = await pool.query(
      `SELECT id, name, parent_id FROM categories ORDER BY name`
    );

    if (rows.rows && rows.rows.length) {
      const map = {};
      rows.rows.forEach((r) => {
        map[r.id] = {
          id: r.id,
          name: r.name,
          parent_id: r.parent_id,
          subcategories: [],
        };
      });
      const roots = [];
      Object.values(map).forEach((node) => {
        if (node.parent_id) {
          const parent = map[node.parent_id];
          if (parent) parent.subcategories.push(node.name);
        } else {
          roots.push(node);
        }
      });
      // Normalize to { name, subcategories[] }
      const categories = roots.map((r) => ({
        name: r.name,
        subcategories: r.subcategories,
      }));
      return res.json({ categories });
    }

    // Fallback: derive categories from businesses/products
    const q = `
      SELECT category FROM (
        SELECT DISTINCT category FROM businesses WHERE category IS NOT NULL
        UNION
        SELECT DISTINCT category FROM products WHERE category IS NOT NULL
      ) t
      ORDER BY category
    `;
    const result = await pool.query(q);
    const categories = result.rows.map((r) => r.category).filter(Boolean);
    res.json({
      categories: categories.map((c) => ({ name: c, subcategories: [] })),
    });
  } catch (err) {
    console.error('Failed to fetch categories:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/* =========================
   SEARCH BUSINESSES — WEIGHTED RELEVANCE + FILTERS + PAGINATION + ROUNDED AVG
========================= */
router.get('/', async (req, res) => {
  try {
    let {
      search,
      category,
      location,
      mall_id,
      verified,
      active,
      min_rating,
      max_rating,
      sort_by,
      page,
      limit,
    } = req.query;

    // Boolean filters
    // Default: only active businesses
    const activeFilter =
      active !== undefined ? active.toLowerCase() === 'true' : true;
    const verifiedFilter =
      verified !== undefined ? verified.toLowerCase() === 'true' : null;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    const values = [];
    let i = 1;

    // Base query with weighted relevance & rounded average_rating
    let query = `
      SELECT 
        businesses.*,
        ROUND(COALESCE(AVG(reviews.rating),0)::numeric,2) AS average_rating,
        ${
          search
            ? `(
                CASE WHEN name ILIKE $${i} THEN 2 ELSE 0 END +
                CASE WHEN description ILIKE $${i} THEN 1 ELSE 0 END
              ) AS relevance`
            : '0 AS relevance'
        }
      FROM businesses
      LEFT JOIN reviews ON reviews.business_id = businesses.id
      WHERE 1=1
    `;

    // Filters
    if (activeFilter !== null) {
      query += ` AND is_active = $${i}`;
      values.push(activeFilter);
      i++;
    }

    if (verifiedFilter !== null) {
      query += ` AND is_verified = $${i}`;
      values.push(verifiedFilter);
      i++;
    }

    if (search) {
      query += ` AND (name ILIKE $${i} OR description ILIKE $${i})`;
      values.push(`%${search}%`);
      i++;
    }

    if (category) {
      query += ` AND category ILIKE $${i}`;
      values.push(`%${category}%`);
      i++;
    }

    if (location) {
      query += ` AND location ILIKE $${i}`;
      values.push(`%${location}%`);
      i++;
    }

    if (mall_id) {
      query += ` AND businesses.mall_id = $${i}`;
      values.push(mall_id);
      i++;
    }

    // GROUP BY for aggregation
    query += ' GROUP BY businesses.id';

    // Rating filters (HAVING for aggregate)
    if (min_rating) {
      query += ` HAVING ROUND(COALESCE(AVG(reviews.rating),0)::numeric,2) >= $${i}`;
      values.push(parseFloat(min_rating));
      i++;
    }
    if (max_rating) {
      if (!min_rating) query += ' HAVING 1=1'; // needed if no min_rating
      query += ` AND ROUND(COALESCE(AVG(reviews.rating),0)::numeric,2) <= $${i}`;
      values.push(parseFloat(max_rating));
      i++;
    }

    // Total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) sub`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Sorting
    let orderBy;
    if (sort_by === 'created_at') {
      orderBy = 'businesses.created_at DESC';
    } else if (sort_by === 'average_rating') {
      orderBy = 'ROUND(COALESCE(AVG(reviews.rating),0)::numeric,2) DESC';
    } else {
      orderBy =
        'relevance DESC, ROUND(COALESCE(AVG(reviews.rating),0)::numeric,2) DESC, businesses.created_at DESC';
    }

    query += ` ORDER BY ${orderBy} LIMIT $${i} OFFSET $${i + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      businesses: result.rows,
    });
  } catch (err) {
    console.error('Business registration error:', err);

    res.status(500).json({
      error: err.message || 'Failed to register business',
      detail: err.detail || null,
      code: err.code || null,
    });
  }
});

/* =========================
   REGISTER BUSINESS (PUBLIC) — WITH PASSWORD + FREE TRIAL
   ✅ No login required
   ✅ Business creates its own account
========================= */
router.post('/register', async (req, res) => {
  const {
    name,
    description,
    category,
    location,
    phone,
    email,
    password,
    logo_url,
    mall_id,
    mall_name,
    mall_address,
    mall_city,
    mall_latitude,
    mall_longitude,
  } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Business name, email, and password are required',
    });
  }

  try {
    // Check if business already exists
    const exists = await pool.query(
      'SELECT id FROM businesses WHERE email=$1',
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({
        error: 'Business email already registered',
      });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Compute trial end date according to promotion rules:
    // - Businesses signing up on or before 2026-06-30 get free until 2026-07-31 (subscription starts 2026-08-01)
    // - Businesses signing up after 2026-06-30 get one month free from their signup date
    const now = new Date();
    const cutoff = new Date(Date.UTC(2026, 5, 30, 23, 59, 59)); // 2026-06-30 UTC (months are 0-based)
    let trialEnd;
    if (now.getTime() <= cutoff.getTime()) {
      // Free through end of July 2026 (local time end of day)
      trialEnd = new Date(2026, 6, 31, 23, 59, 59); // July is month 6
    } else {
      // One month free from signup date
      trialEnd = new Date(now);
      trialEnd.setMonth(trialEnd.getMonth() + 1);
    }

    // Monthly subscription fee after trial
    const monthlyFee = 30;

    // Resolve mall: prefer mall_id, else create/find by mall_name
    let resolvedMallId = null;
    let newMallCreated = false;
    if (mall_id) {
      const m = await pool.query('SELECT id FROM malls WHERE id=$1', [mall_id]);
      if (!m.rows.length) {
        return res.status(400).json({ error: 'Invalid mall_id provided' });
      }
      resolvedMallId = mall_id;
    } else if (mall_name) {
      const mn = mall_name.trim();
      const existing = await pool.query(
        'SELECT id FROM malls WHERE LOWER(name)=LOWER($1)',
        [mn]
      );
      if (existing.rows.length) {
        resolvedMallId = existing.rows[0].id;
      } else {
        const createdMall = await pool.query(
          `INSERT INTO malls (name, address, city, latitude, longitude) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [
            mn,
            mall_address || null,
            mall_city || null,
            mall_latitude || null,
            mall_longitude || null,
          ]
        );
        resolvedMallId = createdMall.rows[0].id;
        newMallCreated = true;
      }
    }

    // Insert business into database (include mall_id nullable)
    // If the user created a new mall during signup, mark the new business inactive
    // until an admin verifies the mall. Otherwise activate immediately.
    const isActive = newMallCreated ? false : true;

    console.debug('Register business values:', {
      name,
      email,
      resolvedMallId,
      newMallCreated,
      isActive,
      trialEnd: trialEnd ? trialEnd.toISOString() : null,
      monthlyFee,
    });

    const insertResult = await pool.query(
      `INSERT INTO businesses
       (name, description, category, location, email,
        password_hash, logo_url,
        is_active, is_verified,
        trial_end_date, monthly_fee, mall_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,$9,$10,$11)
       RETURNING id, name, email`,
      [
        name,
        description || null,
        category || null,
        location || null,
        email,
        hashedPassword,
        logo_url,
        isActive,
        trialEnd,
        monthlyFee,
        resolvedMallId,
      ]
    );

    const respMessage = newMallCreated
      ? `Business registered and pending admin approval (mall verification). Free period until ${trialEnd.toISOString()}`
      : `Business registered successfully. Free period until ${trialEnd.toISOString()}`;

    res.status(201).json({
      message: respMessage,
      business: insertResult.rows[0],
      trial_end_date: trialEnd,
      pending_admin_approval: newMallCreated,
    });
  } catch (err) {
    console.error('Business registration error:', err);
    res.status(500).json({
      error: err.message || 'Failed to register business',
      detail: err.detail || null,
      code: err.code || null,
    });
  }
});

/* =========================
   PRODUCT SUBMISSIONS (ADMIN & USER)
========================= */
router.get('/product-submissions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    let { page, limit, status } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM product_submissions';
    const values = [];
    let i = 1;

    if (status) {
      query += ` WHERE status=$${i}`;
      values.push(status);
      i++;
    }

    const countQuery = query.replace('*', 'COUNT(*) AS total');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    query += ` ORDER BY id DESC LIMIT $${i} OFFSET $${i + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      submissions: result.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch product submissions' });
  }
});

router.get('/product-submissions/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM product_submissions WHERE submitted_by=$1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch your submissions' });
  }
});

router.post(
  '/product-submissions',
  auth,
  upload.single('image'),
  async (req, res) => {
    const { business_id, name, price } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!business_id || !name || price === undefined) {
      return res
        .status(400)
        .json({ error: 'Business ID, product name, and price are required' });
    }

    try {
      const submission = await pool.query(
        `INSERT INTO product_submissions
       (business_id, name, price, image_url, submitted_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
        [business_id, name, price, image, req.user.id]
      );

      res.status(201).json(submission.rows[0]);
    } catch (err) {
      console.error('Product submission error:', err.message);
      res.status(500).json({ error: 'Failed to submit product' });
    }
  }
);

/* =========================
   VERIFY BUSINESS (ADMIN)
========================= */
router.post('/:id/verify', auth, async (req, res) => {
  const businessId = req.params.id;
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    const result = await pool.query(
      'UPDATE businesses SET is_verified=true WHERE id=$1 RETURNING *',
      [businessId]
    );

    if (!result.rows.length)
      return res.status(404).json({ error: 'Business not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to verify business' });
  }
});

/* =========================
   GET PRODUCTS FOR BUSINESS
   (LIST WITH PAGINATION + FILTERS)
========================= */
router.get('/:businessId/products', async (req, res) => {
  const { businessId } = req.params;
  const { page = 1, limit = 10, category, search, sort } = req.query;
  const offset = (page - 1) * limit;

  try {
    // 1. Check if business exists
    const bizCheck = await pool.query('SELECT id FROM businesses WHERE id=$1', [
      businessId,
    ]);
    if (bizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Dynamic Query Builder
    let query =
      'SELECT * FROM products WHERE business_id=$1 AND is_active=true';
    let countQuery =
      'SELECT COUNT(*) FROM products WHERE business_id=$1 AND is_active=true';
    let values = [businessId];
    let valueCounter = 2; // $1 is businessId

    // Filter by Category
    if (category && category !== 'All') {
      const catFilter = ` AND category = $${valueCounter}`;
      query += catFilter;
      countQuery += catFilter;
      values.push(category);
      valueCounter++;
    }

    // Filter by Search
    if (search) {
      const searchFilter = ` AND name ILIKE $${valueCounter}`;
      query += searchFilter;
      countQuery += searchFilter;
      values.push(`%${search}%`);
      valueCounter++;
    }

    // Sort Logic
    let orderBy = ' ORDER BY id DESC'; // Default
    if (sort) {
      switch (sort) {
        case 'Oldest':
          orderBy = ' ORDER BY created_at ASC';
          break;
        case 'Newest':
          orderBy = ' ORDER BY created_at DESC';
          break;
        case 'Price Low to High':
          orderBy = ' ORDER BY price ASC';
          break;
        case 'Price High to Low':
          orderBy = ' ORDER BY price DESC';
          break;
        case 'Highest Rating':
          orderBy = ' ORDER BY average_rating DESC';
          break;
        case 'Lowest Rating':
          orderBy = ' ORDER BY average_rating ASC';
          break;
        case 'Most Commented':
          orderBy = ' ORDER BY review_count DESC';
          break;
        case 'A-Z':
          orderBy = ' ORDER BY name ASC';
          break;
        default:
          orderBy = ' ORDER BY id DESC';
      }
    }
    query += orderBy;

    // Apply Limit/Offset to final query only
    const countValues = [...values];

    query += ` LIMIT $${valueCounter} OFFSET $${valueCounter + 1}`;
    values.push(limit);
    values.push(offset); // offset

    // 2. Count products (Filtered)
    const totalResult = await pool.query(countQuery, countValues);
    const total = parseInt(totalResult.rows[0].count);

    // 3. Fetch products (Filtered)
    const result = await pool.query(query, values);

    // 4. Get available categories for filter dropdown
    const catResult = await pool.query(
      'SELECT DISTINCT category FROM products WHERE business_id = $1 AND is_active = true AND category IS NOT NULL',
      [businessId]
    );
    const categories = catResult.rows.map((r) => r.category).filter(Boolean);

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      products: result.rows,
      categories,
    });
  } catch (err) {
    console.error('Error in /:businessId/products:', err);
    res
      .status(500)
      .json({ error: 'Failed to fetch products', details: err.message });
  }
});

/* =========================
   CRUD PRODUCTS (OWNER)
========================= */
router.post(
  '/:businessId/products',
  auth,
  upload.single('image'),
  async (req, res) => {
    const { businessId } = req.params;
    const { name, description, price, unit, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Product name and price required' });
    }

    try {
      const check = await pool.query(
        'SELECT * FROM businesses WHERE id=$1 AND owner_id=$2',
        [businessId, req.user.id]
      );

      if (!check.rows.length) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const product = await pool.query(
        `INSERT INTO products
       (business_id, name, description, price, unit, category, image_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)
       RETURNING *`,
        [businessId, name, description, price, unit, category, image]
      );

      const created = product.rows[0];

      // If this product includes promotion fields, notify followers
      const promotionType =
        req.body.promotion_type || req.body.promotionType || null;
      const discount =
        req.body.discount_percent || req.body.discountPercent || null;

      if (promotionType || discount) {
        try {
          // Find followers
          const f = await pool.query(
            'SELECT follower_id FROM follows WHERE business_id=$1',
            [businessId]
          );
          const followers = f.rows.map((r) => r.follower_id);
          if (followers.length) {
            // Ensure notifications table exists
            await pool.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                  id SERIAL PRIMARY KEY,
                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
                  type VARCHAR(50),
                  title TEXT,
                  message TEXT,
                  data JSONB,
                  is_read BOOLEAN DEFAULT FALSE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
              `);

            const title = `New promotion from ${created.name || 'a business'}`;
            const message = `${created.name || 'A business'} published a new promotion.`;
            for (const uid of followers) {
              const notif = await pool.query(
                'INSERT INTO notifications (user_id,business_id,type,title,message,data) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
                [
                  uid,
                  businessId,
                  'promotion',
                  title,
                  message,
                  { productId: created.id },
                ]
              );
              // Emit via socket.io if available
              try {
                const io = req.app.get('io');
                if (io) io.to(String(uid)).emit('notification', notif.rows[0]);
              } catch (e) {
                console.warn('Socket emit failed:', e.message);
              }
            }
          }
        } catch (e) {
          console.error(
            'Failed to notify followers about promotion:',
            e.message
          );
        }
      }

      res.status(201).json(created);
    } catch (err) {
      console.error('Add product error:', err.message);
      res.status(500).json({ error: err.message || 'Failed to add product' });
    }
  }
);

router.put(
  '/products/:productId',
  auth,
  upload.single('image'),
  async (req, res) => {
    const { productId } = req.params;

    try {
      const check = await pool.query(
        `SELECT p.id FROM products p
       JOIN businesses b ON p.business_id=b.id
       WHERE p.id=$1 AND b.owner_id=$2`,
        [productId, req.user.id]
      );

      if (!check.rows.length)
        return res.status(403).json({ error: 'Not authorized' });

      const fields = Object.keys(req.body);
      const values = Object.values(req.body);

      // If an image was uploaded via multipart/form-data, include it in the update
      if (req.file) {
        fields.push('image_url');
        values.push(`/uploads/${req.file.filename}`);
      }
      const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');

      const update = await pool.query(
        `UPDATE products SET ${setQuery} WHERE id=$${fields.length + 1} RETURNING *`,
        [...values, productId]
      );

      res.json(update.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

router.delete('/products/:productId', auth, async (req, res) => {
  const { productId } = req.params;

  console.log('DELETE /products/:productId called', {
    productId,
    userId: req.user?.id,
    userRole: req.user?.role,
  });

  try {
    const check = await pool.query(
      `SELECT p.id, p.business_id, b.owner_id FROM products p
       JOIN businesses b ON p.business_id=b.id
       WHERE p.id=$1`,
      [productId]
    );

    console.log('Product check result:', check.rows);

    if (!check.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check authorization
    if (check.rows[0].owner_id !== req.user.id) {
      console.log('Authorization failed:', {
        productOwnerId: check.rows[0].owner_id,
        requestUserId: req.user.id,
      });
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this product' });
    }

    const result = await pool.query(
      'UPDATE products SET is_active=false, deleted_at=NOW() WHERE id=$1 RETURNING *',
      [productId]
    );

    console.log('Product deleted successfully:', result.rows[0]);
    res.json({ message: 'Product deleted (soft)', product: result.rows[0] });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

/* =========================
   GET BUSINESS BY ID WITH PRODUCTS
========================= */
router.get('/:id', async (req, res) => {
  const businessId = parseInt(req.params.id);
  if (isNaN(businessId))
    return res.status(400).json({ error: 'Invalid business ID' });

  try {
    const businessResult = await pool.query(
      'SELECT * FROM businesses WHERE id=$1 AND is_active=true',
      [businessId]
    );

    if (!businessResult.rows.length)
      return res.status(404).json({ error: 'Business not found' });

    const productsResult = await pool.query(
      'SELECT * FROM products WHERE business_id=$1 AND is_active=true ORDER BY id DESC',
      [businessId]
    );

    res.json({
      business: businessResult.rows[0],
      products: productsResult.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

/* =========================
   UPDATE BUSINESS (OWNER)
========================= */
router.put('/:id', auth, async (req, res) => {
  const businessId = req.params.id;

  try {
    const check = await pool.query(
      'SELECT * FROM businesses WHERE id=$1 AND owner_id=$2',
      [businessId, req.user.id]
    );

    if (!check.rows.length)
      return res.status(403).json({ error: 'Not authorized' });

    const fields = Object.keys(req.body);
    const values = Object.values(req.body);
    if (!fields.length)
      return res.status(400).json({ error: 'No fields provided' });

    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');
    const update = await pool.query(
      `UPDATE businesses SET ${setQuery} WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, businessId]
    );

    res.json(update.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

/* =========================
   DELETE BUSINESS (SOFT DELETE)
========================= */
router.delete('/:id', auth, async (req, res) => {
  console.log('DELETE route hit for ID:', req.params.id);
  const businessId = req.params.id;

  try {
    const check = await pool.query('SELECT * FROM businesses WHERE id=$1', [
      businessId,
    ]);
    if (!check.rows.length)
      return res.status(404).json({ error: 'Business not found' });

    if (req.user.role !== 'admin' && check.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ error: 'Not authorized' });

    const result = await pool.query(
      'UPDATE businesses SET is_active=false WHERE id=$1 RETURNING *',
      [businessId]
    );

    res.json({ message: 'Business deleted (soft)', business: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

/* =========================
   LIST ALL ROUTES (DEBUG)
========================= */
console.log('All business routes:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(
      Object.keys(r.route.methods).join(', ').toUpperCase(),
      r.route.path
    );
  }
});

/* =========================
   EXPORT ROUTER
========================= */
module.exports = router;
