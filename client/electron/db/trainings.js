'use strict';

const { getPool, ensureSchemaReady } = require('./pool');
const { logAudit } = require('./audit');
const { requireAuth, requireRole } = require('./auth');
const { apiError, dt, today, daysFromToday, calcExpiration, parseTrainingValidity, normalizeCertRecert } = require('./helpers');

function normalizePassFail(value) {
  return value === 'Failed' ? 'Failed' : 'Passed';
}

function serializeDetail(row) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    title: row.title,
    category: row.category,
    training_date: row.training_date || null,
    trainer: row.trainer,
    validity_months: row.validity_months,
    validity_days: row.validity_days,
    expiration_date: row.expiration_date || null,
    process_classification: row.process_classification,
    remarks: row.remarks,
    worker_line_status: row.worker_line_status,
    cert_recert: normalizeCertRecert(row.cert_recert),
    pass_fail: normalizePassFail(row.pass_fail),
    take: row.take,
    created_by: row.created_by,
    created_at: dt(row.created_at),
    updated_at: dt(row.updated_at),
  };
}

function serializeList(row) {
  return {
    ...serializeDetail(row),
    is_archived: !!row.is_archived,
    archived_at: dt(row.archived_at),
    employee_name: row.employee_name,
    emp_code: row.emp_code,
    factory: row.factory,
    line: row.line,
    team: row.team,
  };
}

const LIST_SELECT = `SELECT t.*, e.full_name AS employee_name, e.employee_id AS emp_code,
  e.factory AS factory, e.line AS line, e.team AS team
  FROM trainings t JOIN employees e ON e.id = t.employee_id`;

async function findById(id, archived = null) {
  const pool = getPool();
  let sql = `${LIST_SELECT} WHERE t.id = ?`;
  const vals = [id];
  if (archived === true) sql += ' AND t.is_archived = 1';
  if (archived === false) sql += ' AND t.is_archived = 0';
  const [rows] = await pool.query(sql + ' LIMIT 1', vals);
  return rows[0] || null;
}

async function list(params = {}) {
  requireAuth();
  await ensureSchemaReady();
  const pool = getPool();
  const where = ['t.is_archived = 0'];
  const vals = [];

  if (params.employee_id) { where.push('t.employee_id = ?'); vals.push(params.employee_id); }
  if (params.factory) { where.push('e.factory = ?'); vals.push(params.factory); }
  if (params.category) { where.push('t.category = ?'); vals.push(params.category); }
  if (params.title) { where.push('t.title LIKE ?'); vals.push(`%${params.title}%`); }
  if (params.worker_line_status) { where.push('t.worker_line_status = ?'); vals.push(params.worker_line_status); }
  if (params.cert_recert) { where.push('t.cert_recert = ?'); vals.push(normalizeCertRecert(params.cert_recert)); }
  if (params.pass_fail) { where.push('t.pass_fail = ?'); vals.push(normalizePassFail(params.pass_fail)); }
  if (params.take) { where.push('t.take = ?'); vals.push(parseInt(params.take, 10)); }
  if (params.training_date) { where.push('t.training_date = ?'); vals.push(params.training_date); }
  if (params.date_from) { where.push('t.training_date >= ?'); vals.push(params.date_from); }
  if (params.date_to) { where.push('t.training_date <= ?'); vals.push(params.date_to); }
  if (params.search) {
    where.push('(e.full_name LIKE ? OR e.employee_id LIKE ? OR t.title LIKE ?)');
    const like = `%${params.search}%`;
    vals.push(like, like, like);
  }

  const current = today();
  const in10 = daysFromToday(10);
  if (params.expired === 'true') {
    where.push('t.expiration_date IS NOT NULL AND t.expiration_date < ?');
    vals.push(current);
  } else if (params.expiring_soon === 'true') {
    where.push('t.expiration_date IS NOT NULL AND t.expiration_date >= ? AND t.expiration_date <= ?');
    vals.push(current, in10);
  }

  const sql = `${LIST_SELECT} WHERE ${where.join(' AND ')} ORDER BY t.training_date DESC, t.id DESC`;
  const [rows] = await pool.query(sql, vals);
  return rows.map(serializeList);
}

async function listForEmployee(employeeId) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT * FROM trainings WHERE employee_id = ? ORDER BY training_date DESC',
    [employeeId]
  );
  return rows.map(serializeDetail);
}

async function summary() {
  requireAuth();
  const pool = getPool();
  const current = today();
  const in30 = daysFromToday(30);
  const in10 = daysFromToday(10);
  const one = async (sql, vals) => {
    const [r] = await pool.query(sql, vals);
    return Number(r[0].c);
  };
  const total = await one('SELECT COUNT(*) c FROM trainings WHERE is_archived = 0');
  const expired = await one(
    'SELECT COUNT(*) c FROM trainings WHERE is_archived = 0 AND expiration_date IS NOT NULL AND expiration_date < ?', [current]);
  const expiring30 = await one(
    'SELECT COUNT(*) c FROM trainings WHERE is_archived = 0 AND expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?', [current, in30]);
  const expiring60 = await one(
    'SELECT COUNT(*) c FROM trainings WHERE is_archived = 0 AND expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?', [current, in10]);
  const totalEmployees = await one("SELECT COUNT(*) c FROM employees WHERE status = 'active'");
  return { total, expired, expiring30, expiring60, totalEmployees };
}

async function categories() {
  requireAuth();
  const pool = getPool();
  const [rows] = await pool.query("SELECT DISTINCT category FROM trainings WHERE is_archived = 0 AND category <> '' ORDER BY category");
  return rows.map((r) => r.category);
}

async function titles() {
  requireAuth();
  const pool = getPool();
  const [rows] = await pool.query("SELECT DISTINCT title FROM trainings WHERE is_archived = 0 AND title <> '' ORDER BY title");
  return rows.map((r) => r.title);
}

async function create(data = {}) {
  const user = requireRole('admin', 'encoder');
  await ensureSchemaReady();
  const pool = getPool();

  const employeeId = data.employee_id;
  const title = (data.title || '').trim();
  const trainingDate = data.training_date;
  if (!employeeId || !title || !trainingDate) {
    throw apiError('employee_id, title, and training_date are required', 400);
  }

  const [emp] = await pool.query('SELECT id FROM employees WHERE id = ? LIMIT 1', [employeeId]);
  if (!emp.length) throw apiError('Employee not found', 404);

  const { validity_months, validity_days } = parseTrainingValidity(data);
  const expiration = calcExpiration(trainingDate, validity_months, validity_days);
  const certRecert = normalizeCertRecert(data.cert_recert);
  const passFail = normalizePassFail(data.pass_fail);

  const [res] = await pool.query(
    `INSERT INTO trainings
      (employee_id, title, category, training_date, trainer, validity_months, validity_days,
       expiration_date, process_classification, remarks, worker_line_status, cert_recert, pass_fail, take,
       is_archived, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(6), NOW(6))`,
    [
      employeeId, title, data.category || '', trainingDate, data.trainer || '',
      validity_months, validity_days, expiration,
      data.process_classification || '', data.remarks === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      data.worker_line_status || 'Floating',
      certRecert,
      passFail,
      data.take || 1, user.id,
    ]
  );
  const id = res.insertId;
  await logAudit(user, 'CREATE', 'trainings', id, `Created training: ${title}`);
  const row = await findById(id);
  return serializeDetail(row);
}

async function get({ id } = {}) {
  requireAuth();
  const row = await findById(id);
  if (!row) throw apiError('Training record not found', 404);
  const data = serializeDetail(row);
  data.employee_name = row.employee_name;
  data.emp_code = row.emp_code;
  return data;
}

async function update({ id, data } = {}) {
  const user = requireRole('admin', 'encoder');
  await ensureSchemaReady();
  const pool = getPool();
  const training = await findById(id);
  if (!training) throw apiError('Training record not found', 404);
  data = data || {};

  const snapshot = (t) => ({
    title: t.title,
    category: t.category,
    training_date: t.training_date ? String(t.training_date).slice(0, 10) : null,
    trainer: t.trainer,
    validity_months: t.validity_months != null ? Number(t.validity_months) : null,
    validity_days: t.validity_days,
    expiration_date: t.expiration_date ? String(t.expiration_date).slice(0, 10) : null,
    process_classification: t.process_classification,
    worker_line_status: t.worker_line_status,
    cert_recert: normalizeCertRecert(t.cert_recert),
    pass_fail: normalizePassFail(t.pass_fail),
    take: t.take,
    remarks: t.remarks,
  });
  const before = snapshot(training);

  const newDate = data.training_date || (training.training_date ? String(training.training_date).slice(0, 10) : training.training_date);
  const { validity_months, validity_days } = parseTrainingValidity(
    data,
    training.validity_months != null ? Number(training.validity_months) : 12
  );

  const next = {
    title: data.title || training.title,
    category: 'category' in data ? data.category : training.category,
    training_date: newDate,
    trainer: 'trainer' in data ? data.trainer : training.trainer,
    validity_months,
    validity_days,
    expiration_date: calcExpiration(newDate, validity_months, validity_days),
    process_classification: 'process_classification' in data ? data.process_classification : training.process_classification,
    remarks: 'remarks' in data
      ? (data.remarks === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')
      : (training.remarks === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),
    worker_line_status: 'worker_line_status' in data ? data.worker_line_status : training.worker_line_status,
    cert_recert: 'cert_recert' in data
      ? normalizeCertRecert(data.cert_recert)
      : normalizeCertRecert(training.cert_recert),
    pass_fail: 'pass_fail' in data
      ? normalizePassFail(data.pass_fail)
      : normalizePassFail(training.pass_fail),
    take: 'take' in data ? data.take : training.take,
  };

  await pool.query(
    `UPDATE trainings SET
       title = ?, category = ?, training_date = ?, trainer = ?, validity_months = ?, validity_days = ?,
       expiration_date = ?, process_classification = ?, remarks = ?, worker_line_status = ?,
       cert_recert = ?, pass_fail = ?, take = ?,
       updated_at = NOW(6)
     WHERE id = ?`,
    [
      next.title, next.category, next.training_date, next.trainer, next.validity_months, next.validity_days,
      next.expiration_date, next.process_classification, next.remarks, next.worker_line_status,
      next.cert_recert, next.pass_fail, next.take, id,
    ]
  );

  const after = snapshot({ ...next });
  const changes = {};
  for (const key of Object.keys(before)) {
    if (before[key] !== after[key]) changes[key] = { before: before[key], after: after[key] };
  }
  await logAudit(user, 'UPDATE', 'trainings', id, JSON.stringify({ summary: `Updated training: ${next.title}`, changes }));

  const row = await findById(id);
  return serializeDetail(row);
}

// DELETE on a training soft-archives it (matches Django training_detail DELETE).
async function remove({ id } = {}) {
  const user = requireRole('admin');
  const pool = getPool();
  const training = await findById(id);
  if (!training) throw apiError('Training record not found', 404);
  await pool.query('UPDATE trainings SET is_archived = 1, archived_at = NOW(6), updated_at = NOW(6) WHERE id = ?', [id]);
  await logAudit(user, 'ARCHIVE', 'trainings', id, `Archived training: ${training.title}`);
  return { message: 'Training record archived' };
}

async function archived() {
  requireRole('admin');
  const pool = getPool();
  const [rows] = await pool.query(`${LIST_SELECT} WHERE t.is_archived = 1 ORDER BY t.archived_at DESC`);
  return rows.map(serializeList);
}

async function restore({ id } = {}) {
  const user = requireRole('admin');
  const pool = getPool();
  const training = await findById(id, true);
  if (!training) throw apiError('Archived record not found', 404);
  await pool.query('UPDATE trainings SET is_archived = 0, archived_at = NULL, updated_at = NOW(6) WHERE id = ?', [id]);
  await logAudit(user, 'RESTORE', 'trainings', id, `Restored training: ${training.title}`);
  return { message: 'Training record restored' };
}

async function deletePermanent({ id } = {}) {
  const user = requireRole('admin');
  const pool = getPool();
  const training = await findById(id, true);
  if (!training) throw apiError('Archived record not found', 404);
  const title = training.title;
  await pool.query('DELETE FROM trainings WHERE id = ?', [id]);
  await logAudit(user, 'DELETE', 'trainings', id, `Permanently deleted training: ${title}`);
  return { message: 'Training record permanently deleted' };
}

function normalizeIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw apiError('A list of ids is required', 400);
  return ids.map((v) => Number(v)).filter((v) => Number.isFinite(v));
}

async function bulkArchive({ ids } = {}) {
  const user = requireRole('admin');
  const pool = getPool();
  const list_ = normalizeIds(ids);
  const [res] = await pool.query(
    'UPDATE trainings SET is_archived = 1, archived_at = NOW(6), updated_at = NOW(6) WHERE id IN (?) AND is_archived = 0',
    [list_]
  );
  const count = res.affectedRows || 0;
  await logAudit(user, 'DELETE', 'trainings', null, `Bulk archived ${count} training record(s)`);
  return { message: `${count} record(s) archived`, count };
}

async function bulkRestore({ ids } = {}) {
  const user = requireRole('admin');
  const pool = getPool();
  const list_ = normalizeIds(ids);
  const [res] = await pool.query(
    'UPDATE trainings SET is_archived = 0, archived_at = NULL, updated_at = NOW(6) WHERE id IN (?) AND is_archived = 1',
    [list_]
  );
  const count = res.affectedRows || 0;
  await logAudit(user, 'RESTORE', 'trainings', null, `Bulk restored ${count} training record(s)`);
  return { message: `${count} record(s) restored`, count };
}

async function bulkDelete({ ids } = {}) {
  const user = requireRole('admin');
  const pool = getPool();
  const list_ = normalizeIds(ids);
  const [res] = await pool.query('DELETE FROM trainings WHERE id IN (?) AND is_archived = 1', [list_]);
  const count = res.affectedRows || 0;
  await logAudit(user, 'DELETE', 'trainings', null, `Bulk permanently deleted ${count} training record(s)`);
  return { message: `${count} record(s) permanently deleted`, count };
}

module.exports = {
  list, listForEmployee, summary, categories, titles,
  create, get, update, remove, archived, restore, deletePermanent,
  bulkArchive, bulkRestore, bulkDelete,
  serializeDetail, serializeList,
};
