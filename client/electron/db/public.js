'use strict';

const { getPool } = require('./pool');
const { apiError, today, daysFromToday, normalizeCertRecert } = require('./helpers');

async function employees(params = {}) {
  const pool = getPool();
  const current = today();

  const where = [];
  const whereVals = [];

  if (params.status) { where.push('e.status = ?'); whereVals.push(params.status); }
  else { where.push("e.status = 'active'"); }

  if (params.team) { where.push('e.team = ?'); whereVals.push(params.team); }
  if (params.employment_status) { where.push('e.employment_status = ?'); whereVals.push(params.employment_status); }
  if (params.search) {
    where.push('(e.full_name LIKE ? OR e.employee_id LIKE ?)');
    whereVals.push(`%${params.search}%`, `%${params.search}%`);
  }

  if (params.training_title) {
    where.push('EXISTS (SELECT 1 FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0 AND t.title LIKE ?)');
    whereVals.push(`%${params.training_title}%`);
  }

  if (params.expiry_from || params.expiry_to) {
    let sub = 'SELECT 1 FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0 AND t.expiration_date IS NOT NULL';
    if (params.expiry_from) { sub += ' AND t.expiration_date >= ?'; whereVals.push(params.expiry_from); }
    if (params.expiry_to) { sub += ' AND t.expiration_date <= ?'; whereVals.push(params.expiry_to); }
    where.push(`EXISTS (${sub})`);
  }

  if (params.cert_status === 'expired') {
    where.push('EXISTS (SELECT 1 FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0 AND t.expiration_date IS NOT NULL AND t.expiration_date < ?)');
    whereVals.push(current);
  } else if (params.cert_status === 'expiring30') {
    where.push('EXISTS (SELECT 1 FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0 AND t.expiration_date IS NOT NULL AND t.expiration_date >= ? AND t.expiration_date <= ?)');
    whereVals.push(current, daysFromToday(30));
  } else if (params.cert_status === 'expiring60') {
    where.push('EXISTS (SELECT 1 FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0 AND t.expiration_date IS NOT NULL AND t.expiration_date >= ? AND t.expiration_date <= ?)');
    whereVals.push(current, daysFromToday(60));
  }

  const sql = `SELECT e.id, e.employee_id, e.full_name, e.factory, e.line, e.team,
      e.employment_status, e.hire_date, e.status,
      (SELECT COUNT(*) FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0) AS total_trainings,
      (SELECT COUNT(*) FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0
         AND t.expiration_date IS NOT NULL AND t.expiration_date < ?) AS expired_count
    FROM employees e
    WHERE ${where.join(' AND ')}
    ORDER BY e.full_name`;

  const [rows] = await pool.query(sql, [current, ...whereVals]);
  return rows.map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    full_name: r.full_name,
    factory: r.factory,
    line: r.line,
    team: r.team,
    employment_status: r.employment_status,
    hire_date: r.hire_date || null,
    status: r.status,
    total_trainings: Number(r.total_trainings),
    expired_count: Number(r.expired_count),
  }));
}

async function trainingTitles() {
  const pool = getPool();
  const [rows] = await pool.query("SELECT DISTINCT title FROM trainings WHERE is_archived = 0 AND title <> '' ORDER BY title");
  return rows.map((r) => r.title);
}

async function employeeTrainings({ id, training_title, expiry_from, expiry_to, cert_status } = {}) {
  const pool = getPool();
  const current = today();
  const in10 = daysFromToday(10);

  const [empRows] = await pool.query('SELECT * FROM employees WHERE id = ? LIMIT 1', [id]);
  const employee = empRows[0];
  if (!employee) throw apiError('Employee not found', 404);

  const where = ['employee_id = ?', 'is_archived = 0'];
  const vals = [id];
  if (training_title) { where.push('title LIKE ?'); vals.push(`%${training_title}%`); }
  if (expiry_from) { where.push('expiration_date IS NOT NULL AND expiration_date >= ?'); vals.push(expiry_from); }
  if (expiry_to) { where.push('expiration_date IS NOT NULL AND expiration_date <= ?'); vals.push(expiry_to); }
  if (cert_status === 'expired') {
    where.push('expiration_date IS NOT NULL AND expiration_date < ?');
    vals.push(current);
  } else if (cert_status === 'expiring30') {
    where.push('expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?');
    vals.push(current, daysFromToday(30));
  } else if (cert_status === 'expiring60') {
    where.push('expiration_date IS NOT NULL AND expiration_date >= ? AND expiration_date <= ?');
    vals.push(current, daysFromToday(60));
  }

  const [rows] = await pool.query(
    `SELECT * FROM trainings WHERE ${where.join(' AND ')} ORDER BY training_date DESC, id DESC`,
    vals
  );

  const trainings = rows.map((t) => {
    const exp = t.expiration_date ? String(t.expiration_date).slice(0, 10) : null;
    let status;
    if (exp === null) status = 'valid';
    else if (exp < current) status = 'expired';
    else if (exp <= in10) status = 'expiring';
    else status = 'valid';
    return {
      id: t.id,
      title: t.title,
      category: t.category,
      training_date: t.training_date ? String(t.training_date).slice(0, 10) : null,
      trainer: t.trainer,
      validity_months: t.validity_months,
      expiration_date: exp,
      worker_line_status: t.worker_line_status,
      cert_recert: normalizeCertRecert(t.cert_recert),
      take: t.take,
      process_classification: t.process_classification,
      remarks: t.remarks,
      cert_status: status,
    };
  });

  return {
    employee: {
      id: employee.id,
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      factory: employee.factory,
      line: employee.line,
      team: employee.team,
      position: employee.position,
      employment_status: employee.employment_status,
      hire_date: employee.hire_date || null,
    },
    trainings,
  };
}

async function exportDirectory() {
  const pool = getPool();
  const current = today();
  const in10 = daysFromToday(10);

  const [employeeRows] = await pool.query(
    `SELECT e.id, e.employee_id, e.full_name, e.factory, e.line, e.team,
      e.employment_status, e.hire_date, e.status,
      (SELECT COUNT(*) FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0) AS total_trainings,
      (SELECT COUNT(*) FROM trainings t WHERE t.employee_id = e.id AND t.is_archived = 0
         AND t.expiration_date IS NOT NULL AND t.expiration_date < ?) AS expired_count
    FROM employees e
    WHERE e.status = 'active'
    ORDER BY e.full_name`,
    [current],
  );

  const [trainingRows] = await pool.query(
    `SELECT e.employee_id, e.full_name, e.factory, e.line, e.team,
      t.title, t.category, t.process_classification, t.training_date, t.expiration_date,
      t.cert_recert, t.take, t.trainer
    FROM trainings t
    JOIN employees e ON e.id = t.employee_id
    WHERE t.is_archived = 0 AND e.status = 'active'
    ORDER BY e.full_name ASC, t.training_date DESC, t.id DESC`,
  );

  const employees = employeeRows.map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    full_name: r.full_name,
    factory: r.factory,
    line: r.line,
    team: r.team,
    employment_status: r.employment_status,
    hire_date: r.hire_date || null,
    status: r.status,
    total_trainings: Number(r.total_trainings),
    expired_count: Number(r.expired_count),
  }));

  const trainings = trainingRows.map((t) => {
    const exp = t.expiration_date ? String(t.expiration_date).slice(0, 10) : null;
    let cert_status;
    if (exp === null) cert_status = 'valid';
    else if (exp < current) cert_status = 'expired';
    else if (exp <= in10) cert_status = 'expiring';
    else cert_status = 'valid';
    return {
      employee_id: t.employee_id,
      full_name: t.full_name,
      factory: t.factory,
      line: t.line,
      team: t.team,
      title: t.title,
      category: t.category,
      process_classification: t.process_classification,
      training_date: t.training_date ? String(t.training_date).slice(0, 10) : null,
      expiration_date: exp,
      cert_recert: normalizeCertRecert(t.cert_recert),
      take: t.take,
      trainer: t.trainer,
      cert_status,
    };
  });

  return { employees, trainings };
}

module.exports = { employees, trainingTitles, employeeTrainings, exportDirectory };
