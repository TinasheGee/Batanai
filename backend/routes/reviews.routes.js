console.log('✅ reviews.routes.js loaded');

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ------------------------
// POST REVIEW (USER)
// ------------------------
router.post('/', auth, async (req, res) => {
  const { business_id, product_id, rating, comment } = req.body;

  if (!rating || (!business_id && !product_id)) {
    return res.status(400).json({ error: 'Rating and target required' });
  }

  try {
    // 1️⃣ Insert the review
    const result = await pool.query(
      `INSERT INTO reviews (business_id, product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        business_id || null,
        product_id || null,
        req.user.id,
        rating,
        comment || '',
      ]
    );

    // 2️⃣ Update the business summary (average_rating + review_count)
    if (business_id) {
      await pool.query(
        `
        UPDATE businesses
        SET
          average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM reviews
            WHERE business_id = $1
          ),
          review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE business_id = $1
          )
        WHERE id = $1
        `,
        [business_id]
      );
    }

    // Update product rating if a product_id is provided
    if (product_id) {
      await pool.query(
        `
    UPDATE products
    SET
      average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM reviews
        WHERE product_id = $1
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE product_id = $1
      )
    WHERE id = $1
    `,
        [product_id]
      );
    }

    // 3️⃣ Send the response
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ------------------------
// GET REVIEWS FOR BUSINESS
// ------------------------
router.get('/business/:businessId', async (req, res) => {
  const { businessId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name, COALESCE(r.seconds_count, 0) as seconds_count 
       FROM reviews r 
       JOIN users u ON r.user_id=u.id 
       WHERE business_id=$1 
       ORDER BY created_at DESC`,
      [businessId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ------------------------
// GET REVIEWS FOR PRODUCT
// ------------------------
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, u.full_name, COALESCE(r.seconds_count, 0) as seconds_count 
       FROM reviews r 
       JOIN users u ON r.user_id=u.id 
       WHERE product_id=$1 
       ORDER BY created_at DESC`,
      [productId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/business-summary/:businessId
router.get('/business-summary/:businessId', async (req, res) => {
  const { businessId } = req.params;

  try {
    const result = await pool.query(
      'SELECT average_rating, review_count FROM businesses WHERE id=$1',
      [businessId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Business not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch business summary' });
  }
});

// ------------------------
// GET BUSINESS RATING SUMMARY
// ------------------------
router.get('/business/:businessId/summary', async (req, res) => {
  const { businessId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(*)::int AS total_reviews,
        ROUND(AVG(rating)::numeric, 1) AS average_rating
      FROM reviews
      WHERE business_id = $1
      `,
      [businessId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch rating summary' });
  }
});

// GET /api/reviews/product-summary/:productId
router.get('/product-summary/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      'SELECT average_rating, review_count FROM products WHERE id=$1',
      [productId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch product summary' });
  }
});

// ------------------------
// POST REPLY TO REVIEW (BUSINESS ONLY)
// ------------------------
router.post('/:reviewId/reply', auth, async (req, res) => {
  const { reviewId } = req.params;
  const { reply_text } = req.body;

  if (!reply_text || reply_text.trim() === '') {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  try {
    // Get the review to find the business_id (either directly or through product)
    const reviewResult = await pool.query(
      `SELECT 
        r.business_id, 
        r.product_id,
        p.business_id as product_business_id
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       WHERE r.id = $1`,
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Get business_id either from review directly or from the product's business
    const businessId =
      reviewResult.rows[0].business_id ||
      reviewResult.rows[0].product_business_id;

    if (!businessId) {
      return res
        .status(400)
        .json({ error: 'Could not determine business for this review' });
    }

    // Check if the user is the owner of the business
    const ownerCheck = await pool.query(
      'SELECT id FROM businesses WHERE id=$1 AND owner_id=$2',
      [businessId, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: 'Only business owners can reply to reviews' });
    }

    // Insert the reply
    const result = await pool.query(
      `INSERT INTO review_replies (review_id, business_id, reply_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [reviewId, businessId, reply_text]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Reply error:', err.message);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// ------------------------
// GET REPLIES FOR A REVIEW
// ------------------------
router.get('/:reviewId/replies', async (req, res) => {
  const { reviewId } = req.params;

  try {
    const result = await pool.query(
      `SELECT rr.*, b.name as business_name, b.logo_url as business_logo
       FROM review_replies rr
       JOIN businesses b ON rr.business_id = b.id
       WHERE rr.review_id = $1
       ORDER BY rr.created_at ASC`,
      [reviewId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get replies error:', err.message);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// ------------------------
// SECOND A REVIEW (CUSTOMER ONLY)
// ------------------------
router.post('/:reviewId/second', auth, async (req, res) => {
  const { reviewId } = req.params;

  try {
    // Check if user is a customer
    const userCheck = await pool.query('SELECT role FROM users WHERE id=$1', [
      req.user.id,
    ]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.rows[0].role !== 'customer') {
      return res
        .status(403)
        .json({ error: 'Only customers can second reviews' });
    }

    // Check if review exists
    const reviewCheck = await pool.query(
      'SELECT user_id FROM reviews WHERE id=$1',
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is trying to second their own review
    if (reviewCheck.rows[0].user_id === req.user.id) {
      return res
        .status(400)
        .json({ error: 'You cannot second your own review' });
    }

    // Check if already seconded
    const existingSecond = await pool.query(
      'SELECT id FROM review_seconds WHERE review_id=$1 AND user_id=$2',
      [reviewId, req.user.id]
    );

    if (existingSecond.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'You have already seconded this review' });
    }

    // Insert the second
    await pool.query(
      'INSERT INTO review_seconds (review_id, user_id) VALUES ($1, $2)',
      [reviewId, req.user.id]
    );

    // Update seconds count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM review_seconds WHERE review_id=$1',
      [reviewId]
    );

    const secondsCount = parseInt(countResult.rows[0].count);

    await pool.query('UPDATE reviews SET seconds_count=$1 WHERE id=$2', [
      secondsCount,
      reviewId,
    ]);

    res.json({ success: true, seconds_count: secondsCount });
  } catch (err) {
    console.error('Second review error:', err.message);
    res.status(500).json({ error: 'Failed to second review' });
  }
});

// ------------------------
// UNSECOND A REVIEW
// ------------------------
router.delete('/:reviewId/second', auth, async (req, res) => {
  const { reviewId } = req.params;

  try {
    // Delete the second
    const result = await pool.query(
      'DELETE FROM review_seconds WHERE review_id=$1 AND user_id=$2',
      [reviewId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Second not found' });
    }

    // Update seconds count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM review_seconds WHERE review_id=$1',
      [reviewId]
    );

    const secondsCount = parseInt(countResult.rows[0].count);

    await pool.query('UPDATE reviews SET seconds_count=$1 WHERE id=$2', [
      secondsCount,
      reviewId,
    ]);

    res.json({ success: true, seconds_count: secondsCount });
  } catch (err) {
    console.error('Unsecond review error:', err.message);
    res.status(500).json({ error: 'Failed to unsecond review' });
  }
});

// ------------------------
// CHECK IF USER HAS SECONDED A REVIEW
// ------------------------
router.get('/:reviewId/check-second', auth, async (req, res) => {
  const { reviewId } = req.params;

  try {
    const result = await pool.query(
      'SELECT id FROM review_seconds WHERE review_id=$1 AND user_id=$2',
      [reviewId, req.user.id]
    );

    res.json({ hasSeconded: result.rows.length > 0 });
  } catch (err) {
    console.error('Check second error:', err.message);
    res.status(500).json({ error: 'Failed to check second status' });
  }
});

module.exports = router;
