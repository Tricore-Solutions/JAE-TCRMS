'use strict';

const bcrypt = require('bcryptjs');
const { getPool } = require('./pool');
const { logAudit } = require('./audit');
const { requireRole } = require('./auth');
const { apiError, dt, userDisplayName } = require('./helpers');

const ROLES = ['admin', 'encoder', 'viewer'];
const STATUSES = ['active', 'inactive'];

function serialize(row) {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    role: row.role,
    status: row.status,
    created_at: dt(row.created_at),
  };
}

async function getById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function list() {
  requireRole('admin');
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users ORDER BY username');
  return rows.map(serialize);
}

async function get({ id } = {}) {
  requireRole('admin');
  const row = await getById(id);
  if (!row) throw apiError('User not found', 404);
  return serialize(row);
}

async function activeAdminCount(pool) {
  const [rows] = await pool.query("SELECT COUNT(*) c FROM users WHERE role = 'admin' AND status = 'active'");
  return Number(rows[0].c);
}

async function create(data = {}) {
  const actor = requireRole('admin');
  const pool = getPool();

  const username = (data.username || '').trim().toLowerCase();
  const password = data.password;
  const role = data.role;
  if (!username) throw apiError('username is required', 400);
  if (!password) throw apiError('password is required', 400);
  if (!ROLES.includes(role)) throw apiError('role must be one of admin, encoder, viewer', 400);

  const [dup] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
  if (dup.length) throw apiError('Username already exists', 409);

  const hash = bcrypt.hashSync(password, 10);
  const [res] = await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', NOW(6), NOW(6))`,
    [username, hash, data.full_name || '', role]
  );
  const id = res.insertId;
  const row = await getById(id);
  await logAudit(actor, 'CREATE', 'users', id, `Created user: ${userDisplayName(row)}`);
  return serialize(row);
}

async function update({ id, data } = {}) {
  const actor = requireRole('admin');
  const pool = getPool();
  const user = await getById(id);
  if (!user) throw apiError('User not found', 404);
  data = data || {};

  if ('role' in data && !ROLES.includes(data.role)) throw apiError('role must be one of admin, encoder, viewer', 400);
  if ('status' in data && !STATUSES.includes(data.status)) throw apiError('status must be active or inactive', 400);

  const newRole = 'role' in data ? data.role : user.role;
  if (user.role === 'admin' && newRole !== 'admin') {
    if ((await activeAdminCount(pool)) <= 1) {
      throw apiError('Cannot change role of the last active admin', 400);
    }
  }

  const fields = [];
  const vals = [];
  if ('full_name' in data) { fields.push('full_name = ?'); vals.push(data.full_name); }
  if ('role' in data) { fields.push('role = ?'); vals.push(data.role); }
  if ('status' in data) { fields.push('status = ?'); vals.push(data.status); }
  if (data.password) { fields.push('password_hash = ?'); vals.push(bcrypt.hashSync(data.password, 10)); }

  if (fields.length) {
    fields.push('updated_at = NOW(6)');
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...vals, id]);
  }

  const row = await getById(id);
  await logAudit(actor, 'UPDATE', 'users', id, `Updated user: ${userDisplayName(row)}`);
  return serialize(row);
}

async function remove({ id } = {}) {
  const actor = requireRole('admin');
  const pool = getPool();
  const user = await getById(id);
  if (!user) throw apiError('User not found', 404);

  if (Number(user.id) === Number(actor.id)) {
    throw apiError('Cannot deactivate your own account', 400);
  }
  if (user.role === 'admin' && (await activeAdminCount(pool)) <= 1) {
    throw apiError('Cannot deactivate the last admin', 400);
  }

  await pool.query("UPDATE users SET status = 'inactive', updated_at = NOW(6) WHERE id = ?", [id]);
  await logAudit(actor, 'DELETE', 'users', id, `Deactivated user: ${userDisplayName(user)}`);
  return { message: 'User deactivated' };
}

module.exports = { list, get, create, update, remove, serialize };
