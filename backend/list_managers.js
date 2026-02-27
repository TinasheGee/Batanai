const pool = require('./db');

async function listManagers() {
  try {
    const res = await pool.query(
      "SELECT id, full_name, email, role FROM users WHERE role = 'business' LIMIT 20"
    );
    console.log('Manager Accounts (Business Role):');
    res.rows.forEach((user) => {
      console.log(`- ${user.full_name} (${user.email})`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error fetching managers:', err);
    process.exit(1);
  }
}

listManagers();
