const pool = require('./db');
(async () => {
  try {
    const c = await pool.query(
      'SELECT id,name,parent_id FROM categories ORDER BY id'
    );
    console.log('CATEGORIES_COUNT:', c.rows.length);
    console.log(JSON.stringify(c.rows, null, 2));

    const b = await pool.query(
      'SELECT id,name,category,subcategory,latitude,longitude,logo_url FROM businesses ORDER BY id LIMIT 10'
    );
    console.log('BUSINESSES_SAMPLE_COUNT:', b.rows.length);
    console.log(JSON.stringify(b.rows, null, 2));
  } catch (e) {
    console.error('Inspect failed:', e);
  } finally {
    await pool.end();
  }
})();
