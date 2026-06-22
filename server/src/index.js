require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB (runs schema + seed on first start)
require('./db');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/trainings', require('./routes/trainings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));

// Public viewer endpoint — no auth required
app.get('/api/public/employees', (req, res) => {
  const db = require('./db');
  const { search, team, status } = req.query;
  let query = `
    SELECT e.id, e.employee_id, e.full_name, e.factory, e.line, e.team, e.status,
           COUNT(t.id) as total_trainings,
           SUM(CASE WHEN t.expiration_date IS NOT NULL AND t.expiration_date < date('now') THEN 1 ELSE 0 END) as expired_count
    FROM employees e
    LEFT JOIN trainings t ON t.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND e.status = ?'; params.push(status); }
  else { query += " AND e.status = 'active'"; }
  if (team) { query += ' AND e.team = ?'; params.push(team); }
  if (search) {
    query += ' AND (e.full_name LIKE ? OR e.employee_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' GROUP BY e.id ORDER BY e.full_name';

  const employees = db.prepare(query).all(...params);
  res.json(employees);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JAE-TCRMS Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api`);
});
