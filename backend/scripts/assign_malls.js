const pool = require('../db');

(async () => {
  try {
    console.log('🔀 Assigning businesses to malls...');

    const mallsRes = await pool.query('SELECT id FROM malls ORDER BY id');
    const mallIds = mallsRes.rows.map((r) => r.id);
    if (!mallIds.length) {
      console.log('No malls found. Exiting.');
      process.exit(0);
    }

    const bizRes = await pool.query('SELECT id FROM businesses ORDER BY id');
    const bizIds = bizRes.rows.map((r) => r.id);
    if (!bizIds.length) {
      console.log('No businesses found. Exiting.');
      process.exit(0);
    }

    // Shuffle businesses for randomness
    for (let i = bizIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bizIds[i], bizIds[j]] = [bizIds[j], bizIds[i]];
    }

    const assignments = new Map(); // bizId -> mallId

    // Ensure each mall has at least one business
    const min = Math.min(bizIds.length, mallIds.length);
    let idx = 0;
    for (let m = 0; m < mallIds.length; m++) {
      if (idx >= bizIds.length) break;
      const bizId = bizIds[idx++];
      assignments.set(bizId, mallIds[m]);
    }

    // Assign remaining businesses randomly to malls
    while (idx < bizIds.length) {
      const bizId = bizIds[idx++];
      const mall = mallIds[Math.floor(Math.random() * mallIds.length)];
      assignments.set(bizId, mall);
    }

    // Run updates in a transaction
    await pool.query('BEGIN');
    for (const [bizId, mallId] of assignments.entries()) {
      await pool.query('UPDATE businesses SET mall_id=$1 WHERE id=$2', [
        mallId,
        bizId,
      ]);
    }
    await pool.query('COMMIT');

    // Report counts per mall
    const counts = {};
    for (const mallId of mallIds) counts[mallId] = 0;
    for (const mallId of assignments.values())
      counts[mallId] = (counts[mallId] || 0) + 1;

    console.log('Assignment complete. Business counts per mall:');
    console.table(counts);
    process.exit(0);
  } catch (err) {
    console.error('Failed to assign malls:', err.message || err);
    try {
      await pool.query('ROLLBACK');
    } catch (_) {}
    process.exit(1);
  }
})();
