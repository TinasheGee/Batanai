const pool = require('./db');
(async () => {
  try {
    const r = await pool.query('SELECT COUNT(*) AS cnt FROM categories');
    console.log('CATEGORIES_COUNT:', r.rows[0].cnt);
    const p = await pool.query(
      'SELECT COUNT(*) AS top FROM categories WHERE parent_id IS NULL'
    );
    console.log('TOP_LEVEL_CATEGORIES:', p.rows[0].top);
  } catch (e) {
    console.error('Count failed:', e);
  } finally {
    await pool.end();
  }
})();
