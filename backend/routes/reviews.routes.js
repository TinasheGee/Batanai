console.log("✅ reviews.routes.js loaded");

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// ------------------------
// POST REVIEW (USER)
// ------------------------
router.post("/", auth, async (req, res) => {
  const { business_id, product_id, rating, comment } = req.body;

  if (!rating || (!business_id && !product_id)) {
    return res.status(400).json({ error: "Rating and target required" });
  }

  try {
    // 1️⃣ Insert the review
    const result = await pool.query(
      `INSERT INTO reviews (business_id, product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [business_id || null, product_id || null, req.user.id, rating, comment || ""]
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
    res.status(500).json({ error: "Failed to submit review" });
  }
});


// ------------------------
// GET REVIEWS FOR BUSINESS
// ------------------------
router.get("/business/:businessId", async (req, res) => {
  const { businessId } = req.params;

  try {
    const result = await pool.query(
      "SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id=u.id WHERE business_id=$1 ORDER BY created_at DESC",
      [businessId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// ------------------------
// GET REVIEWS FOR PRODUCT
// ------------------------
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      "SELECT r.*, u.full_name FROM reviews r JOIN users u ON r.user_id=u.id WHERE product_id=$1 ORDER BY created_at DESC",
      [productId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// GET /api/reviews/business-summary/:businessId
router.get("/business-summary/:businessId", async (req, res) => {
  const { businessId } = req.params;

  try {
    const result = await pool.query(
      "SELECT average_rating, review_count FROM businesses WHERE id=$1",
      [businessId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Business not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch business summary" });
  }
});

// ------------------------
// GET BUSINESS RATING SUMMARY
// ------------------------
router.get("/business/:businessId/summary", async (req, res) => {
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
    res.status(500).json({ error: "Failed to fetch rating summary" });
  }
});

// GET /api/reviews/product-summary/:productId
router.get("/product-summary/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      "SELECT average_rating, review_count FROM products WHERE id=$1",
      [productId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch product summary" });
  }
});


module.exports = router;
