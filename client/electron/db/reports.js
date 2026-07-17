'use strict';

const { getPool } = require('./pool');
const { requireAuth } = require('./auth');
const { today, daysFromToday, userDisplayName, formatAuditDate, MONTH_NAMES_SHORT, normalizeCertRecert } = require('./helpers');

async function scalar(pool, sql, vals = []) {
  const [rows] = await pool.query(sql, vals);
  return Number(rows[0].c);
}

async function overview() {
  requireAuth();
  const pool = getPool();
  const current = today();
  const in10 = daysFromToday(10);

  const totalEmployees = await scalar(pool, "SELECT COUNT(*) c FROM employees WHERE status = 'active'");
  const employeeTotal = await scalar(pool, 'SELECT COUNT(*) c FROM employees');
  const totalTrainings = await scalar(pool, 'SELECT COUNT(*) c FROM trainings WHERE is_archived = 0');
  const activeCertifications = await scalar(pool,
    'SELECT COUNT(*) c FROM trainings WHERE is_archived = 0 AND (expiration_date IS NULL OR expiration_date >= ?)', [current]);
  const expiredCerts = await scalar(pool,
    'SELECT COUNT(*) c FROM trainings WHERE is_archived = 0 AND expiration_date IS NOT NULL AND expiration_date < ?', [current]);
  const expiringCount = await scalar(pool,
    'SELECT COUNT(*) c FROM trainings WHERE is_archived = 0 AND expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?', [current, in10]);
  const employeesWithTraining = await scalar(pool,
    "SELECT COUNT(DISTINCT e.id) c FROM employees e JOIN trainings t ON t.employee_id = e.id AND t.is_archived = 0 WHERE e.status = 'active'");
  const totalUsers = await scalar(pool, "SELECT COUNT(*) c FROM users WHERE status = 'active'");

  const completionRate = totalEmployees
    ? Math.round((employeesWithTraining / totalEmployees) * 100 * 10) / 10
    : 0.0;

  return {
    totalEmployees,
    employeeTotal,
    totalTrainings,
    activeCertifications,
    trainingCompletionRate: completionRate,
    expiredCerts,
    expiring30: expiringCount,
    expiredAndExpiring: expiredCerts + expiringCount,
    expiring60: expiringCount,
    totalUsers,
  };
}

async function byCategory() {
  requireAuth();
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT category, COUNT(*) AS count FROM trainings WHERE category <> '' GROUP BY category ORDER BY count DESC"
  );
  return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
}

async function byFactory() {
  requireAuth();
  const pool = getPool();
  const [factories] = await pool.query(
    "SELECT DISTINCT factory FROM employees WHERE status = 'active' AND factory <> '' ORDER BY factory"
  );
  const result = [];
  for (const { factory } of factories) {
    const employeeCount = await scalar(pool, "SELECT COUNT(*) c FROM employees WHERE status = 'active' AND factory = ?", [factory]);
    const trainingCount = await scalar(pool,
      'SELECT COUNT(*) c FROM trainings t JOIN employees e ON e.id = t.employee_id WHERE e.factory = ?', [factory]);
    result.push({ factory, employee_count: employeeCount, training_count: trainingCount });
  }
  return result;
}

async function expiring(params = {}) {
  requireAuth();
  const pool = getPool();
  const current = today();
  const in10 = daysFromToday(10);

  const base = `SELECT t.id, t.title, t.expiration_date, t.training_date,
    e.full_name, e.employee_id AS emp_code, e.factory, e.line, e.team
    FROM trainings t JOIN employees e ON e.id = t.employee_id`;

  let sql;
  let vals = [];
  if (params.expired === 'true') {
    sql = `${base} WHERE t.expiration_date IS NOT NULL AND t.expiration_date < ? ORDER BY t.expiration_date`;
    vals = [current];
  } else if (params.days) {
    const inDays = daysFromToday(parseInt(params.days, 10));
    sql = `${base} WHERE t.expiration_date IS NOT NULL AND t.expiration_date >= ? AND t.expiration_date <= ? ORDER BY t.expiration_date`;
    vals = [current, inDays];
  } else {
    sql = `${base} WHERE t.expiration_date IS NOT NULL AND t.expiration_date <= ? ORDER BY t.expiration_date LIMIT 100`;
    vals = [in10];
  }

  const [rows] = await pool.query(sql, vals);
  return rows.map((t) => {
    const exp = String(t.expiration_date).slice(0, 10);
    let certStatus;
    if (exp < current) certStatus = 'expired';
    else if (exp <= in10) certStatus = 'expiring';
    else certStatus = 'valid';
    return {
      id: t.id,
      title: t.title,
      expiration_date: exp,
      training_date: String(t.training_date).slice(0, 10),
      full_name: t.full_name,
      emp_code: t.emp_code,
      factory: t.factory,
      line: t.line,
      team: t.team,
      cert_status: certStatus,
    };
  });
}

async function auditLogs({ limit } = {}) {
  requireAuth();
  const pool = getPool();
  const lim = parseInt(limit, 10) || 50;
  const [rows] = await pool.query(
    `SELECT a.id, a.action, a.table_name, a.record_id, a.details, a.created_at, a.username,
            u.full_name AS user_full_name, u.username AS user_username
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC LIMIT ?`,
    [lim]
  );
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    table_name: r.table_name,
    record_id: r.record_id,
    details: r.details,
    created_at: r.created_at ? String(r.created_at).replace(' ', 'T') : null,
    full_name: userDisplayName(
      r.user_username ? { full_name: r.user_full_name, username: r.user_username } : null,
      r.username
    ),
  }));
}

async function recordLogs({ table, id } = {}) {
  requireAuth();
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT a.action, a.details, a.created_at, a.username,
            u.full_name AS user_full_name, u.username AS user_username
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.table_name = ? AND a.record_id = ?
     ORDER BY a.created_at DESC`,
    [table, id]
  );
  return rows.map((log) => {
    const entry = {
      action: log.action,
      full_name: userDisplayName(
        log.user_username ? { full_name: log.user_full_name, username: log.user_username } : null,
        log.username
      ),
      created_at: formatAuditDate(log.created_at),
      summary: log.details || '',
      changes: {},
    };
    if (log.details) {
      try {
        const parsed = JSON.parse(log.details);
        if (parsed && typeof parsed === 'object') {
          entry.summary = parsed.summary != null ? parsed.summary : log.details;
          entry.changes = parsed.changes || {};
        }
      } catch (_) {
        entry.summary = log.details;
      }
    }
    return entry;
  });
}

async function exportTrainings(params = {}) {
  requireAuth();
  const { ensureSchemaReady } = require('./pool');
  await ensureSchemaReady();
  const pool = getPool();
  const where = ['t.is_archived = 0'];
  const vals = [];

  if (params.factory) { where.push('e.factory = ?'); vals.push(params.factory); }
  if (params.category) { where.push('t.category = ?'); vals.push(params.category); }
  if (params.title) { where.push('t.title LIKE ?'); vals.push(`%${params.title}%`); }
  if (params.worker_line_status) { where.push('t.worker_line_status = ?'); vals.push(params.worker_line_status); }
  if (params.cert_recert) { where.push('t.cert_recert = ?'); vals.push(normalizeCertRecert(params.cert_recert)); }
  if (params.pass_fail) { where.push('t.pass_fail = ?'); vals.push(params.pass_fail === 'Failed' ? 'Failed' : 'Passed'); }
  if (params.take) { where.push('t.take = ?'); vals.push(parseInt(params.take, 10)); }
  if (params.training_date) { where.push('t.training_date = ?'); vals.push(params.training_date); }
  if (params.date_from) { where.push('t.training_date >= ?'); vals.push(params.date_from); }
  if (params.date_to) { where.push('t.training_date <= ?'); vals.push(params.date_to); }
  if (params.status) { where.push('e.status = ?'); vals.push(params.status); }
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

  const sql = `SELECT t.id, e.employee_id AS emp_code, e.full_name, e.factory, e.line, e.team,
    t.title, t.category, t.training_date, t.trainer, t.validity_months, t.expiration_date,
    t.process_classification, t.worker_line_status, t.cert_recert, t.pass_fail, t.take, t.remarks
    FROM trainings t JOIN employees e ON e.id = t.employee_id
    WHERE ${where.join(' AND ')} ORDER BY e.full_name ASC, t.training_date DESC`;
  const [rows] = await pool.query(sql, vals);
  return rows.map((t) => ({
    id: t.id,
    emp_code: t.emp_code,
    full_name: t.full_name,
    factory: t.factory,
    line: t.line,
    team: t.team,
    title: t.title,
    category: t.category,
    training_date: String(t.training_date).slice(0, 10),
    trainer: t.trainer,
    validity_months: t.validity_months,
    expiration_date: t.expiration_date ? String(t.expiration_date).slice(0, 10) : null,
    process_classification: t.process_classification,
    worker_line_status: t.worker_line_status,
    cert_recert: normalizeCertRecert(t.cert_recert),
    pass_fail: t.pass_fail === 'Failed' ? 'Failed' : 'Passed',
    take: t.take,
    remarks: t.remarks,
  }));
}

async function takesPerMonth() {
  requireAuth();
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT YEAR(training_date) AS year, MONTH(training_date) AS month_num, take, COUNT(*) AS count
     FROM trainings
     WHERE is_archived = 0 AND take IN (1, 2, 3)
     GROUP BY year, month_num, take
     ORDER BY year, month_num, take`
  );

  const allTakes = [1, 2, 3];
  const monthMap = {};
  const monthOrder = [];
  for (const row of rows) {
    if (!row.year || !row.month_num) continue;
    const label = `${MONTH_NAMES_SHORT[row.month_num - 1]} ${row.year}`;
    if (!(label in monthMap)) {
      monthMap[label] = {};
      monthOrder.push(label);
    }
    monthMap[label][row.take] = Number(row.count);
  }

  const data = {};
  for (const month of monthOrder) {
    data[month] = {};
    for (const t of allTakes) {
      data[month][String(t)] = monthMap[month][t] || 0;
    }
  }

  return { months: monthOrder, takes: allTakes, data };
}

module.exports = {
  overview, byCategory, byFactory, expiring,
  auditLogs, recordLogs, exportTrainings, takesPerMonth,
};
