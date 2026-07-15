'use strict';

const { getPool } = require('./pool');
const { userDisplayName } = require('./helpers');

// Mirrors api/utils.log_audit. `user` may be null (e.g. system tasks pass a
// synthetic { username } object).
async function logAudit(user, action, tableName, recordId = null, details = null) {
  const pool = getPool();
  const username = user ? userDisplayName(user) : null;
  await pool.query(
    `INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(6))`,
    [user && user.id != null ? user.id : null, username, action, tableName, recordId, details]
  );
}

module.exports = { logAudit };
