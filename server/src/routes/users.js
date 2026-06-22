const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare(
    'SELECT id, username, full_name, role, status, created_at FROM users ORDER BY username'
  ).all();
  res.json(users);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, username, full_name, role, status, created_at FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /api/users
router.post('/', (req, res) => {
  const { username, password, full_name, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'username, password, and role are required' });
  }
  if (!['admin', 'encoder', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (existing) return res.status(409).json({ error: 'Username already exists' });

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES (?, ?, ?, ?)
  `).run(username.trim().toLowerCase(), password_hash, full_name || '', role);

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'CREATE', 'users', result.lastInsertRowid, `Created user: ${username}`);

  const created = db.prepare('SELECT id, username, full_name, role, status FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const { full_name, role, status, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Prevent removing the last active admin
  if (role && role !== 'admin' && user.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND status = 'active'").get().cnt;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot change role of the last active admin' });
    }
  }

  let password_hash = user.password_hash;
  if (password) {
    password_hash = bcrypt.hashSync(password, 10);
  }

  db.prepare(`
    UPDATE users
    SET full_name = ?, role = ?, status = ?, password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    full_name !== undefined ? full_name : user.full_name,
    role || user.role,
    status || user.status,
    password_hash,
    req.params.id
  );

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'UPDATE', 'users', req.params.id, `Updated user: ${user.username}`);

  const updated = db.prepare('SELECT id, username, full_name, role, status FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/users/:id — soft delete (set inactive)
router.delete('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot deactivate your own account' });

  if (user.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND status = 'active'").get().cnt;
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot deactivate the last admin' });
  }

  db.prepare("UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'DELETE', 'users', req.params.id, `Deactivated user: ${user.username}`);

  res.json({ message: 'User deactivated' });
});

module.exports = router;
