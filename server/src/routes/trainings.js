const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function calcExpiration(trainingDate, validityMonths) {
  if (!trainingDate || !validityMonths) return null;
  const d = new Date(trainingDate);
  d.setMonth(d.getMonth() + parseInt(validityMonths));
  return d.toISOString().split('T')[0];
}

// GET /api/trainings — list all training records with employee info
router.get('/', (req, res) => {
  const { employee_id, category, expiring_soon, expired, search } = req.query;
  let query = `
    SELECT t.*, e.full_name AS employee_name, e.employee_id AS emp_code,
           e.factory, e.line, e.team
    FROM trainings t
    JOIN employees e ON t.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (employee_id) { query += ' AND t.employee_id = ?'; params.push(employee_id); }
  if (category) { query += ' AND t.category = ?'; params.push(category); }
  if (search) {
    query += ' AND (e.full_name LIKE ? OR e.employee_id LIKE ? OR t.title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const in60Days = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

  if (expired === 'true') {
    query += ' AND t.expiration_date IS NOT NULL AND t.expiration_date < ?';
    params.push(today);
  } else if (expiring_soon === 'true') {
    query += ' AND t.expiration_date IS NOT NULL AND t.expiration_date >= ? AND t.expiration_date <= ?';
    params.push(today, in60Days);
  }

  query += ' ORDER BY t.training_date DESC';

  const trainings = db.prepare(query).all(...params);
  res.json(trainings);
});

// GET /api/trainings/summary — dashboard counts
router.get('/summary', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];

  const total = db.prepare('SELECT COUNT(*) as cnt FROM trainings').get().cnt;
  const expired = db.prepare(
    'SELECT COUNT(*) as cnt FROM trainings WHERE expiration_date IS NOT NULL AND expiration_date < ?'
  ).get(today).cnt;
  const expiring30 = db.prepare(
    'SELECT COUNT(*) as cnt FROM trainings WHERE expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?'
  ).get(today, in30).cnt;
  const expiring60 = db.prepare(
    'SELECT COUNT(*) as cnt FROM trainings WHERE expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?'
  ).get(today, in60).cnt;

  const totalEmployees = db.prepare("SELECT COUNT(*) as cnt FROM employees WHERE status = 'active'").get().cnt;

  res.json({ total, expired, expiring30, expiring60, totalEmployees });
});

// GET /api/trainings/:id
router.get('/:id', (req, res) => {
  const training = db.prepare(`
    SELECT t.*, e.full_name AS employee_name, e.employee_id AS emp_code
    FROM trainings t
    JOIN employees e ON t.employee_id = e.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!training) return res.status(404).json({ error: 'Training record not found' });
  res.json(training);
});

// POST /api/trainings
router.post('/', requireRole('admin', 'encoder'), (req, res) => {
  const {
    employee_id, title, category, training_date, trainer,
    validity_months, process_classification, remarks
  } = req.body;

  if (!employee_id || !title || !training_date) {
    return res.status(400).json({ error: 'employee_id, title, and training_date are required' });
  }

  const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const expiration_date = calcExpiration(training_date, validity_months || 12);

  const result = db.prepare(`
    INSERT INTO trainings
      (employee_id, title, category, training_date, trainer, validity_months, expiration_date, process_classification, remarks, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    employee_id,
    title.trim(),
    category || '',
    training_date,
    trainer || '',
    validity_months || 12,
    expiration_date,
    process_classification || '',
    remarks || '',
    req.user.id
  );

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'CREATE', 'trainings', result.lastInsertRowid, `Created training: ${title}`);

  const created = db.prepare('SELECT * FROM trainings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/trainings/:id
router.put('/:id', requireRole('admin', 'encoder'), (req, res) => {
  const training = db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id);
  if (!training) return res.status(404).json({ error: 'Training record not found' });

  const {
    title, category, training_date, trainer,
    validity_months, process_classification, remarks
  } = req.body;

  const newDate = training_date || training.training_date;
  const newValidity = validity_months !== undefined ? validity_months : training.validity_months;
  const expiration_date = calcExpiration(newDate, newValidity);

  db.prepare(`
    UPDATE trainings
    SET title = ?, category = ?, training_date = ?, trainer = ?,
        validity_months = ?, expiration_date = ?, process_classification = ?, remarks = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || training.title,
    category !== undefined ? category : training.category,
    newDate,
    trainer !== undefined ? trainer : training.trainer,
    newValidity,
    expiration_date,
    process_classification !== undefined ? process_classification : training.process_classification,
    remarks !== undefined ? remarks : training.remarks,
    req.params.id
  );

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'UPDATE', 'trainings', req.params.id, `Updated training: ${title || training.title}`);

  const updated = db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/trainings/:id — admin only
router.delete('/:id', requireRole('admin'), (req, res) => {
  const training = db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id);
  if (!training) return res.status(404).json({ error: 'Training record not found' });

  db.prepare('DELETE FROM trainings WHERE id = ?').run(req.params.id);

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'DELETE', 'trainings', req.params.id, `Deleted training: ${training.title}`);

  res.json({ message: 'Training record deleted' });
});

// GET /api/trainings/meta/categories
router.get('/meta/categories', (req, res) => {
  const categories = db.prepare("SELECT DISTINCT category FROM trainings WHERE category != '' ORDER BY category").all().map(r => r.category);
  res.json(categories);
});

module.exports = router;
