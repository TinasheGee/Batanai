const pool = require('./db');
const fs = require('fs');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    const result = `✅ Connection Successful! Time: ${res.rows[0].now}`;
    fs.writeFileSync('connection_result.txt', result);
    process.exit(0);
  } catch (err) {
    const result = `❌ Connection Failed! Error: ${err.message}`;
    fs.writeFileSync('connection_result.txt', result);
    process.exit(1);
  }
})();
