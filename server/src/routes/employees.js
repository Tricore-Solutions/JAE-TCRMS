const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// GET /api/employees — list all employees with optional filters
router.get('/', (req, res) => {
  const { status, factory, line, team, search } = req.query;
  let query = 'SELECT * FROM employees WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (factory) { query += ' AND factory = ?'; params.push(factory); }
  if (line) { query += ' AND line = ?'; params.push(line); }
  if (team) { query += ' AND team = ?'; params.push(team); }
  if (search) {
    query += ' AND (full_name LIKE ? OR employee_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY full_name ASC';

  const employees = db.prepare(query).all(...params);
  res.json(employees);
});

// GET /api/employees/:id — get single employee with their trainings
router.get('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const trainings = db.prepare(
    'SELECT * FROM trainings WHERE employee_id = ? ORDER BY training_date DESC'
  ).all(employee.id);

  res.json({ ...employee, trainings });
});

// POST /api/employees — create employee (encoder or admin)
router.post('/', requireRole('admin', 'encoder'), (req, res) => {
  const { employee_id, full_name, factory, line, team, position, status, hire_date } = req.body;

  if (!employee_id || !full_name) {
    return res.status(400).json({ error: 'employee_id and full_name are required' });
  }

  const existing = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(employee_id);
  if (existing) {
    return res.status(409).json({ error: 'Employee ID already exists' });
  }

  const result = db.prepare(`
    INSERT INTO employees (employee_id, full_name, factory, line, team, position, status, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    employee_id.trim(),
    full_name.trim(),
    factory || '',
    line || '',
    team || '',
    position || '',
    status || 'active',
    hire_date || null
  );

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'CREATE', 'employees', result.lastInsertRowid, `Created employee: ${full_name}`);

  const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/employees/:id — update employee (encoder or admin)
router.put('/:id', requireRole('admin', 'encoder'), (req, res) => {
  const { full_name, factory, line, team, position, status, hire_date } = req.body;
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  db.prepare(`
    UPDATE employees
    SET full_name = ?, factory = ?, line = ?, team = ?, position = ?, status = ?, hire_date = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    full_name || employee.full_name,
    factory !== undefined ? factory : employee.factory,
    line !== undefined ? line : employee.line,
    team !== undefined ? team : employee.team,
    position !== undefined ? position : employee.position,
    status || employee.status,
    hire_date !== undefined ? hire_date : employee.hire_date,
    req.params.id
  );

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'UPDATE', 'employees', req.params.id, `Updated employee: ${full_name || employee.full_name}`);

  const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/employees/:id — admin only (soft delete: set status to resigned)
router.delete('/:id', requireRole('admin'), (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  db.prepare("UPDATE employees SET status = 'resigned', updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  db.prepare(
    'INSERT INTO audit_logs (user_id, username, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, req.user.username, 'DELETE', 'employees', req.params.id, `Deactivated employee: ${employee.full_name}`);

  res.json({ message: 'Employee deactivated' });
});

// GET /api/employees/meta/filters — get distinct values for filter dropdowns
router.get('/meta/filters', (req, res) => {
  const factories = db.prepare("SELECT DISTINCT factory FROM employees WHERE factory != '' ORDER BY factory").all().map(r => r.factory);
  const lines = db.prepare("SELECT DISTINCT line FROM employees WHERE line != '' ORDER BY line").all().map(r => r.line);
  const teams = db.prepare("SELECT DISTINCT team FROM employees WHERE team != '' ORDER BY team").all().map(r => r.team);
  res.json({ factories, lines, teams });
});

module.exports = router;
