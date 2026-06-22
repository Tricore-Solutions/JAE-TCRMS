const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/reports/overview — main dashboard stats
router.get('/overview', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

  const totalEmployees   = db.prepare("SELECT COUNT(*) as cnt FROM employees WHERE status = 'active'").get().cnt;
  const totalTrainings   = db.prepare('SELECT COUNT(*) as cnt FROM trainings').get().cnt;
  const expiredCerts     = db.prepare('SELECT COUNT(*) as cnt FROM trainings WHERE expiration_date IS NOT NULL AND expiration_date < ?').get(today).cnt;
  const expiring30       = db.prepare('SELECT COUNT(*) as cnt FROM trainings WHERE expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?').get(today, in30).cnt;
  const expiring60       = db.prepare('SELECT COUNT(*) as cnt FROM trainings WHERE expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?').get(today, in60).cnt;
  const totalUsers       = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE status = 'active'").get().cnt;

  res.json({ totalEmployees, totalTrainings, expiredCerts, expiring30, expiring60, totalUsers });
});

// GET /api/reports/by-category — trainings grouped by category
router.get('/by-category', (req, res) => {
  const rows = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM trainings
    WHERE category != ''
    GROUP BY category
    ORDER BY count DESC
  `).all();
  res.json(rows);
});

// GET /api/reports/by-factory — employees grouped by factory
router.get('/by-factory', (req, res) => {
  const rows = db.prepare(`
    SELECT factory, COUNT(*) as employee_count,
           (SELECT COUNT(*) FROM trainings t JOIN employees e2 ON t.employee_id = e2.id WHERE e2.factory = e.factory) as training_count
    FROM employees e
    WHERE status = 'active' AND factory != ''
    GROUP BY factory
    ORDER BY factory
  `).all();
  res.json(rows);
});

// GET /api/reports/expiring — list of expiring/expired certs
router.get('/expiring', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT t.id, t.title, t.expiration_date, t.training_date,
           e.full_name, e.employee_id AS emp_code, e.factory, e.line, e.team,
           CASE
             WHEN t.expiration_date < ? THEN 'expired'
             WHEN t.expiration_date <= ? THEN 'expiring'
             ELSE 'valid'
           END as cert_status
    FROM trainings t
    JOIN employees e ON t.employee_id = e.id
    WHERE t.expiration_date IS NOT NULL AND t.expiration_date <= ?
    ORDER BY t.expiration_date ASC
    LIMIT 100
  `).all(today, in60, in60);

  res.json(rows);
});

// GET /api/reports/audit-logs — recent audit trail (admin only)
router.get('/audit-logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const rows = db.prepare(
    'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?'
  ).all(limit);
  res.json(rows);
});

// GET /api/reports/export/trainings — export all training data as JSON (client converts to CSV)
router.get('/export/trainings', (req, res) => {
  const { factory, category, status: empStatus } = req.query;
  let query = `
    SELECT t.id, e.employee_id AS emp_code, e.full_name, e.factory, e.line, e.team,
           t.title, t.category, t.training_date, t.trainer, t.validity_months,
           t.expiration_date, t.process_classification, t.remarks
    FROM trainings t
    JOIN employees e ON t.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (factory) { query += ' AND e.factory = ?'; params.push(factory); }
  if (category) { query += ' AND t.category = ?'; params.push(category); }
  if (empStatus) { query += ' AND e.status = ?'; params.push(empStatus); }
  query += ' ORDER BY e.full_name, t.training_date DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

module.exports = router;
