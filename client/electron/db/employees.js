'use strict';

const { getPool } = require('./pool');
const { logAudit } = require('./audit');
const { requireAuth, requireRole } = require('./auth');
const { apiError, dt } = require('./helpers');

function serialize(row) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    last_name: row.last_name,
    first_name: row.first_name,
    middle_initial: row.middle_initial,
    full_name: row.full_name,
    factory: row.factory,
    line: row.line,
    team: row.team,
    employment_status: row.employment_status,
    status: row.status,
    hire_date: row.hire_date || null,
    created_at: dt(row.created_at),
    updated_at: dt(row.updated_at),
  };
}

function buildFullName(lastName, firstName, middleInitial) {
  let name = `${lastName}, ${firstName}`;
  if (middleInitial) {
    const mi = middleInitial.replace(/\.+$/, '');
    name += ` ${mi}.`;
  }
  return name;
}

async function getById(id) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM employees WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function list(params = {}) {
  requireAuth();
  const pool = getPool();
  const where = [];
  const vals = [];
  for (const field of ['status', 'factory', 'line', 'team', 'employment_status']) {
    if (params[field]) {
      where.push(`${field} = ?`);
      vals.push(params[field]);
    }
  }
  if (params.search) {
    where.push('(full_name LIKE ? OR employee_id LIKE ?)');
    vals.push(`%${params.search}%`, `%${params.search}%`);
  }
  let sql = 'SELECT * FROM employees';
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY full_name';
  const [rows] = await pool.query(sql, vals);
  return rows.map(serialize);
}

async function filters() {
  requireAuth();
  const pool = getPool();
  const [f] = await pool.query("SELECT DISTINCT factory FROM employees WHERE factory <> '' ORDER BY factory");
  const [l] = await pool.query("SELECT DISTINCT line FROM employees WHERE line <> '' ORDER BY line");
  const [t] = await pool.query("SELECT DISTINCT team FROM employees WHERE team <> '' ORDER BY team");
  return {
    factories: f.map((r) => r.factory),
    lines: l.map((r) => r.line),
    teams: t.map((r) => r.team),
  };
}

async function get({ id } = {}) {
  requireAuth();
  const pool = getPool();
  const row = await getById(id);
  if (!row) throw apiError('Employee not found', 404);
  const data = serialize(row);
  const trainings = require('./trainings');
  data.trainings = await trainings.listForEmployee(row.id);
  return data;
}

async function create(data = {}) {
  const user = requireRole('admin', 'encoder');
  const pool = getPool();

  const employeeId = (data.employee_id || '').trim();
  const lastName = (data.last_name || '').trim();
  const firstName = (data.first_name || '').trim();
  const middleInitial = (data.middle_initial || '').trim();

  if (!employeeId || !lastName || !firstName) {
    throw apiError('employee_id, last_name, and first_name are required', 400);
  }

  const [exists] = await pool.query('SELECT id FROM employees WHERE employee_id = ? LIMIT 1', [employeeId]);
  if (exists.length) throw apiError('Employee ID already exists', 409);

  const fullName = buildFullName(lastName, firstName, middleInitial);
  const [res] = await pool.query(
    `INSERT INTO employees
      (employee_id, last_name, first_name, middle_initial, full_name, factory, line, team,
       employment_status, status, hire_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6), NOW(6))`,
    [
      employeeId, lastName, firstName, middleInitial, fullName,
      data.factory || '', data.line || '', data.team || '',
      data.employment_status || '',
      data.status || 'active', data.hire_date || null,
    ]
  );
  const id = res.insertId;
  await logAudit(user, 'CREATE', 'employees', id, `Created employee: ${fullName}`);
  const row = await getById(id);
  return serialize(row);
}

async function update({ id, data } = {}) {
  const user = requireRole('admin', 'encoder');
  const pool = getPool();
  const employee = await getById(id);
  if (!employee) throw apiError('Employee not found', 404);

  const snapshot = (e) => ({
    employee_id: e.employee_id,
    full_name: e.full_name,
    factory: e.factory,
    line: e.line,
    team: e.team,
    employment_status: e.employment_status,
    hire_date: e.hire_date || null,
    status: e.status,
  });
  const before = snapshot(employee);
  data = data || {};

  let employeeId = (data.employee_id || employee.employee_id).trim();
  if (!employeeId) throw apiError('employee_id is required', 400);
  if (employeeId !== employee.employee_id) {
    const [dup] = await pool.query('SELECT id FROM employees WHERE employee_id = ? AND id <> ? LIMIT 1', [employeeId, id]);
    if (dup.length) throw apiError('Employee ID already exists', 409);
  }

  const lastName = (data.last_name || employee.last_name || '').trim();
  const firstName = (data.first_name || employee.first_name || '').trim();
  let middleInitial = ('middle_initial' in data ? String(data.middle_initial ?? '') : (employee.middle_initial || '')).trim();
  const fullName = buildFullName(lastName, firstName, middleInitial);

  const next = {
    employee_id: employeeId,
    last_name: lastName,
    first_name: firstName,
    middle_initial: middleInitial,
    full_name: fullName,
    factory: employee.factory,
    line: employee.line,
    team: employee.team,
    employment_status: employee.employment_status,
    hire_date: employee.hire_date || null,
    status: employee.status,
  };

  for (const field of ['factory', 'line', 'team', 'employment_status', 'hire_date']) {
    if (field in data) {
      let value = data[field];
      if (field === 'hire_date' && (value === '' || value === undefined)) value = null;
      next[field] = value;
    }
  }
  if (data.status) next.status = data.status;

  await pool.query(
    `UPDATE employees SET
       employee_id = ?, last_name = ?, first_name = ?, middle_initial = ?, full_name = ?,
       factory = ?, line = ?, team = ?, employment_status = ?, status = ?,
       hire_date = ?, updated_at = NOW(6)
     WHERE id = ?`,
    [
      next.employee_id, next.last_name, next.first_name, next.middle_initial, next.full_name,
      next.factory, next.line, next.team, next.employment_status, next.status,
      next.hire_date, id,
    ]
  );

  const after = snapshot({ ...next });
  const changes = {};
  for (const key of Object.keys(before)) {
    if (before[key] !== after[key]) changes[key] = { before: before[key], after: after[key] };
  }
  await logAudit(
    user, 'UPDATE', 'employees', id,
    JSON.stringify({ summary: `Updated employee: ${fullName}`, changes })
  );

  const row = await getById(id);
  return serialize(row);
}

async function remove({ id } = {}) {
  const user = requireRole('admin');
  const pool = getPool();
  const employee = await getById(id);
  if (!employee) throw apiError('Employee not found', 404);
  await pool.query("UPDATE employees SET status = 'resigned', updated_at = NOW(6) WHERE id = ?", [id]);
  await logAudit(user, 'DELETE', 'employees', id, `Deactivated employee: ${employee.full_name}`);
  return { message: 'Employee deactivated' };
}

module.exports = { list, filters, get, create, update, remove, serialize, getById };
