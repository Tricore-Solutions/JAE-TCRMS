'use strict';

const bcrypt = require('bcryptjs');
const { getPool } = require('./pool');
const store = require('./store');
const { logAudit } = require('./audit');
const { apiError, userDisplayName } = require('./helpers');

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours, matching the old JWT expiry

let currentUser = null;

function getCurrentUser() {
  return currentUser;
}

function requireAuth() {
  if (!currentUser) throw apiError('Authentication required.', 401);
  return currentUser;
}

function requireRole(...roles) {
  const user = requireAuth();
  if (!roles.includes(user.role)) throw apiError('Insufficient permissions', 403);
  return user;
}

function publicUser(u) {
  return { id: u.id, username: u.username, full_name: u.full_name, role: u.role };
}

async function login({ username, password } = {}) {
  const pool = getPool();
  username = (username || '').trim().toLowerCase();
  if (!username || !password) {
    throw apiError('Username and password are required', 400);
  }

  const [rows] = await pool.query(
    'SELECT id, username, password_hash, full_name, role, status FROM users WHERE username = ? AND status = ? LIMIT 1',
    [username, 'active']
  );
  const user = rows[0];
  if (!user) throw apiError('Invalid username or password', 401);

  const ok = bcrypt.compareSync(password, user.password_hash || '');
  if (!ok) throw apiError('Invalid username or password', 401);

  await logAudit(user, 'LOGIN', 'users', null, `User ${userDisplayName(user)} logged in`);

  currentUser = { id: user.id, username: user.username, full_name: user.full_name, role: user.role, status: user.status };
  const expiresAt = Date.now() + SESSION_TTL_MS;
  store.setSession({ userId: user.id, expiresAt });

  return { token: `local-${user.id}-${expiresAt}`, user: publicUser(user) };
}

// Returns the current user (matching Django's /auth/me shape incl. status).
async function me() {
  if (!currentUser) {
    // Try to restore from a persisted, unexpired session.
    const session = store.getSession();
    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      throw apiError('Not authenticated', 401);
    }
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, username, full_name, role, status FROM users WHERE id = ? LIMIT 1',
      [session.userId]
    );
    const u = rows[0];
    if (!u || u.status !== 'active') {
      store.clearSession();
      throw apiError('Not authenticated', 401);
    }
    currentUser = u;
  }
  return {
    id: currentUser.id,
    username: currentUser.username,
    full_name: currentUser.full_name,
    role: currentUser.role,
    status: currentUser.status,
  };
}

async function logout() {
  if (currentUser) {
    try {
      await logAudit(currentUser, 'LOGOUT', 'users', null, `User ${userDisplayName(currentUser)} logged out`);
    } catch (_) { /* ignore */ }
  }
  currentUser = null;
  store.clearSession();
  return { message: 'Logged out' };
}

function clearCurrentUser() {
  currentUser = null;
}

module.exports = {
  login,
  me,
  logout,
  getCurrentUser,
  requireAuth,
  requireRole,
  clearCurrentUser,
};
