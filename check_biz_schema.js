const pool = require('./backend/db');

(async () => {
  try {
    const res = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'businesses'"
    );
    console.log(res.rows.map((r) => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
