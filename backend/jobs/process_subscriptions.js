/**
 * Job: process_subscriptions
 * - Ensures notifications table exists
 * - Finds businesses whose trial_end_date has passed and haven't been processed
 * - Marks them processed and creates in-app notifications for business owners
 * - Emits socket.io events to connected owners
 *
 * This script can be run once (e.g., via cron) or kept running with node-cron.
 */

require('dotenv').config();
const pool = require('../db');
const cron = require('node-cron');

async function ensureNotificationsTable() {
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

  // Add trial_processed column to businesses if it doesn't exist
  await pool.query(
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_processed BOOLEAN DEFAULT FALSE`
  );
}

async function processOnce(io) {
  console.log('[subscriptions] Running subscription processing...');
  const client = await pool.connect();
  try {
    const now = new Date();
    const res = await client.query(
      `SELECT id, name, owner_id, trial_end_date FROM businesses WHERE trial_end_date IS NOT NULL AND trial_end_date <= $1 AND (trial_processed IS NULL OR trial_processed = false)`,
      [now]
    );

    if (!res.rows.length) {
      console.log('[subscriptions] No businesses to process');
      return;
    }

    for (const b of res.rows) {
      try {
        // Mark processed
        await client.query(
          'UPDATE businesses SET trial_processed=true WHERE id=$1',
          [b.id]
        );

        // Create notification for the business owner
        const title = 'Trial ended — billing starts';
        const message = `Your free period for ${b.name} ended on ${b.trial_end_date || 'now'}. Billing will start.`;
        const notif = await client.query(
          `INSERT INTO notifications (user_id, business_id, type, title, message, data) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [b.owner_id, b.id, 'billing', title, message, { businessId: b.id }]
        );

        console.log(
          '[subscriptions] Created notification for owner',
          b.owner_id
        );

        // Emit via socket.io if available
        if (io) {
          try {
            io.to(String(b.owner_id)).emit('notification', notif.rows[0]);
            console.log(
              '[subscriptions] Emitted socket notification to',
              b.owner_id
            );
          } catch (e) {
            console.warn('[subscriptions] Socket emit failed:', e.message);
          }
        }
      } catch (inner) {
        console.error(
          '[subscriptions] Error processing business',
          b.id,
          inner.message
        );
      }
    }
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await ensureNotificationsTable();
    console.log('[subscriptions] Setup complete');

    // If run with an active server we can fetch io from require('../index') but index.js already starts server.
    // For this job we'll attempt to connect to the running API's socket.io via a simple emit using a redis/pubsub or leave it to the API to broadcast.
    // To keep this self-contained we'll not assume an in-process io instance — instead the API routes will emit when events happen.

    // Schedule daily at 00:05
    cron.schedule('5 0 * * *', async () => {
      console.log('[subscriptions] Cron triggered');
      await processOnce(null);
    });

    // Also run once immediately
    await processOnce(null);

    console.log('[subscriptions] Job running (cron scheduled)');
  } catch (err) {
    console.error('[subscriptions] Fatal error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processOnce };
