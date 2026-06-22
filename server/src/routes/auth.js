const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND status = ?'
  ).get(username.trim().toLowerCase(), 'active');

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Log the login
  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, details) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, user.username, 'LOGIN', 'users', `User ${user.username} logged in`);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, role, status FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /api/auth/logout (client simply discards token; log it server-side)
router.post('/logout', authenticate, (req, res) => {
  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, details) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'LOGOUT', 'users', `User ${req.user.username} logged out`);
  res.json({ message: 'Logged out' });
});

module.exports = router;
