'use strict';

const XLSX = require('xlsx');
const { getPool } = require('./pool');
const { logAudit } = require('./audit');
const { requireRole } = require('./auth');
const { apiError, calcExpiration, normalizeCertRecert } = require('./helpers');

const HEADER_ALIASES = {
  'id no.': 'employee_id',
  'id no': 'employee_id',
  'employee id': 'employee_id',
  'full name': 'full_name',
  'employment': 'employment_status',
  'employment status': 'employment_status',
  'date hired': 'hire_date',
  'team': 'team',
  'line': 'line',
  'classification': 'process_classification',
  'training title': 'title',
  'category': 'category',
  'number of takes': 'take',
  'take': 'take',
  'validity (year / months)': 'validity',
  'validity': 'validity',
  'training date': 'training_date',
  'trainer': 'trainer',
  'expiration': 'expiration_date',
  'remarks': 'remarks',
  'factory (1st / 2nd)': 'factory',
  'factory': 'factory',
  'cert/recert': 'cert_recert',
  'cert/un cert': 'cert_recert',
  'cert/uncert': 'cert_recert',
  'passed/failed': 'pass_fail',
};

const CLASSIFICATION_MAP = {
  'SENSING': 'Sensing',
  'NON SENSING': 'Non-sensing',
  'NON-SENSING': 'Non-sensing',
  'NONSENSING': 'Non-sensing',
};

const TAKE_RE = /(\d+)/;
const VALIDITY_RE = /^\s*([\d.]+)\s*(year|years|yr|yrs|month|months|mo|mos)?\s*$/i;

function normHeader(value) {
  return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function cellStr(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

function pad(n) { return String(n).padStart(2, '0'); }

function serialToISO(serial) {
  const millis = Date.UTC(1899, 11, 30) + serial * 86400000;
  const d = new Date(millis);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function parseExcelDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  if (typeof value === 'number') {
    return serialToISO(value);
  }
  const text = cellStr(value);
  if (!text) return null;
  const iso = text.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date(`${iso}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return iso;
  }
  const num = Number(text);
  if (!Number.isNaN(num)) return serialToISO(num);
  return null;
}

function parseFullName(fullName) {
  fullName = (fullName || '').trim();
  if (!fullName) return ['', '', '', ''];

  if (fullName.includes(',')) {
    const idx = fullName.indexOf(',');
    const last = fullName.slice(0, idx);
    const rest = fullName.slice(idx + 1);
    const parts = rest.trim().split(/\s+/).filter(Boolean);
    const first = parts[0] || '';
    let mi = '';
    if (parts.length > 1) mi = parts[1][0].toUpperCase();
    return [last.trim(), first, mi, fullName];
  }

  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return [parts[0], parts[0], '', fullName];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const mi = parts.length > 2 ? parts[1][0].toUpperCase() : '';
  return [last, first, mi, fullName];
}

function parseTake(value) {
  const text = cellStr(value).toUpperCase();
  if (!text) return 1;
  const match = TAKE_RE.exec(text);
  if (match) {
    const take = parseInt(match[1], 10);
    return take > 0 ? take : 1;
  }
  return 1;
}

function parseValidityMonths(value) {
  const text = cellStr(value);
  if (!text) return null;
  const match = VALIDITY_RE.exec(text);
  if (!match) return null;
  let amount = parseFloat(match[1]);
  const unit = (match[2] || 'months').toLowerCase();
  if (unit.startsWith('y')) amount *= 12;
  return Number.isFinite(amount) ? amount : null;
}

function mapClassification(value) {
  const raw = cellStr(value);
  if (!raw) return '';
  const mapped = CLASSIFICATION_MAP[raw.toUpperCase()];
  if (mapped) return mapped;
  for (const option of ['Beginner', 'Basic', 'Expert', 'Advanced', 'Non-sensing', 'Sensing']) {
    if (raw.toLowerCase() === option.toLowerCase()) return option;
  }
  return raw;
}

function parseCertRecert(value) {
  return normalizeCertRecert(value);
}

function parsePassFail(value) {
  const text = cellStr(value).toUpperCase().replace(/[\s-]+/g, '');
  if (!text) return 'Passed';
  if (text === 'FAILED' || text === 'FAIL' || text === 'F') return 'Failed';
  return 'Passed';
}

function trainingIdentityKey(employeeId, title, trainingDate, take) {
  return `${employeeId}|${title}|${trainingDate}|${take}`;
}

const TRAINING_UPDATE_FIELDS = [
  'category', 'trainer', 'validity_months', 'validity_days', 'expiration_date',
  'process_classification', 'remarks', 'cert_recert', 'pass_fail',
];

function normalizeTrainingField(field, value) {
  if (field === 'expiration_date') {
    return value ? String(value).slice(0, 10) : null;
  }
  if (field === 'validity_months') {
    return value == null || value === '' ? null : Number(value);
  }
  if (field === 'validity_days') {
    return value == null || value === '' ? null : Number(value);
  }
  if (field === 'remarks') {
    return value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }
  if (field === 'cert_recert') {
    return parseCertRecert(value);
  }
  if (field === 'pass_fail') {
    return parsePassFail(value);
  }
  return value == null ? '' : String(value).trim();
}

function trainingPayloadChanged(existing, payload) {
  return TRAINING_UPDATE_FIELDS.some(
    (field) => normalizeTrainingField(field, existing[field]) !== normalizeTrainingField(field, payload[field]),
  );
}

function buildTrainingPayload(item, employeeDbId, user) {
  const title = item.title;
  const trainingDate = parseExcelDate(item.training_date);
  const take = parseTake(item.take);

  let validityMonths = parseValidityMonths(item.validity);
  let expirationDate = parseExcelDate(item.expiration_date);
  if (expirationDate === null && validityMonths !== null) {
    expirationDate = calcExpiration(trainingDate, validityMonths, null);
  }
  if (validityMonths === null && expirationDate === null) {
    validityMonths = 12;
    expirationDate = calcExpiration(trainingDate, 12, null);
  }

  const remarksRaw = cellStr(item.remarks);
  return {
    employee_id: employeeDbId,
    title,
    category: cellStr(item.category),
    training_date: trainingDate,
    trainer: cellStr(item.trainer),
    validity_months: validityMonths,
    validity_days: null,
    expiration_date: expirationDate,
    process_classification: mapClassification(item.process_classification),
    remarks: remarksRaw === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    worker_line_status: 'Floating',
    cert_recert: parseCertRecert(item.cert_recert),
    pass_fail: parsePassFail(item.pass_fail),
    take,
    created_by: user && user.id != null ? user.id : null,
  };
}

function mapHeaders(headerRow) {
  const mapping = {};
  headerRow.forEach((cell, idx) => {
    const key = HEADER_ALIASES[normHeader(cell)];
    if (key && !(key in mapping)) mapping[key] = idx;
  });
  return mapping;
}

function rowDict(values, headerMap) {
  const data = {};
  for (const [key, idx] of Object.entries(headerMap)) {
    data[key] = idx < values.length ? values[idx] : null;
  }
  return data;
}

function readImportRows(bytes) {
  const wb = XLSX.read(bytes, { type: 'array', cellDates: false });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) throw apiError('The Excel file is empty.', 400);

  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, blankrows: false, defval: null });
  if (!matrix.length) throw apiError('The Excel file is empty.', 400);

  const headerRow = matrix[0];
  const headerMap = mapHeaders(headerRow);
  const required = ['employee_id', 'title', 'training_date'];
  const missing = required.filter((k) => !(k in headerMap));
  if (missing.length) {
    const labels = { employee_id: 'ID NO.', title: 'TRAINING TITLE', training_date: 'TRAINING DATE' };
    throw apiError('Missing required column(s): ' + missing.sort().map((m) => labels[m]).join(', '), 400);
  }

  const parsed = [];
  for (let i = 1; i < matrix.length; i++) {
    const values = matrix[i] || [];
    if (values.every((v) => v === null || v === undefined || String(v).trim() === '')) continue;
    const raw = rowDict(values, headerMap);
    const employeeId = cellStr(raw.employee_id);
    const title = cellStr(raw.title);
    if (!employeeId && !title) continue;
    parsed.push({ row: i + 1, ...raw, employee_id: employeeId, title });
  }
  return parsed;
}

async function importTrainingRecords(bytes, user) {
  const pool = getPool();
  const rows = readImportRows(bytes);
  if (!rows.length) throw apiError('No data rows found in the Excel file.', 400);

  const errors = [];
  const employeePayloads = new Map(); // employee_id -> attrs (last wins)

  for (const item of rows) {
    const empCode = item.employee_id;
    if (!empCode) {
      errors.push({ row: item.row, error: 'Missing ID NO.' });
      continue;
    }
    const fullName = cellStr(item.full_name);
    let [lastName, firstName, middleInitial, normalizedName] = parseFullName(fullName);
    if (!normalizedName) {
      normalizedName = empCode;
      lastName = empCode;
      firstName = empCode;
    }
    employeePayloads.set(empCode, {
      employee_id: empCode,
      last_name: lastName || empCode,
      first_name: firstName || empCode,
      middle_initial: middleInitial,
      full_name: normalizedName,
      factory: cellStr(item.factory),
      line: cellStr(item.line),
      team: cellStr(item.team),
      employment_status: cellStr(item.employment_status),
      hire_date: parseExcelDate(item.hire_date),
      status: 'active',
    });
  }

  const codes = [...employeePayloads.keys()];
  const UPDATE_FIELDS = ['last_name', 'first_name', 'middle_initial', 'full_name',
    'factory', 'line', 'team', 'employment_status', 'hire_date', 'status'];

  const conn = await pool.getConnection();
  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let toCreateCount = 0;
  let toUpdateCount = 0;
  let skippedDuplicates = 0;

  try {
    await conn.beginTransaction();

    // Load existing employees
    const existing = new Map();
    if (codes.length) {
      const [existingRows] = await conn.query('SELECT * FROM employees WHERE employee_id IN (?)', [codes]);
      for (const e of existingRows) existing.set(e.employee_id, e);
    }

    const toCreate = [];
    const toUpdate = []; // { id, values: {...} }

    for (const [code, attrs] of employeePayloads) {
      const emp = existing.get(code);
      if (!emp) {
        toCreate.push(attrs);
        continue;
      }
      let changed = false;
      const merged = {};
      for (const field of UPDATE_FIELDS) {
        const value = attrs[field];
        const isBlank = (value === null || value === undefined || value === '');
        if (isBlank && field !== 'hire_date') {
          merged[field] = emp[field];
          continue;
        }
        const existingVal = field === 'hire_date' ? (emp[field] || null) : emp[field];
        if (existingVal !== value) changed = true;
        merged[field] = value;
      }
      if (changed) toUpdate.push({ id: emp.id, values: merged });
    }

    toCreateCount = toCreate.length;
    toUpdateCount = toUpdate.length;

    if (toCreate.length) {
      const cols = ['employee_id', ...UPDATE_FIELDS];
      const placeholders = toCreate.map(() => `(${cols.map(() => '?').join(', ')}, NOW(6), NOW(6))`).join(', ');
      const values = [];
      for (const attrs of toCreate) {
        values.push(attrs.employee_id);
        for (const f of UPDATE_FIELDS) values.push(attrs[f] === undefined ? null : attrs[f]);
      }
      await conn.query(
        `INSERT INTO employees (${cols.join(', ')}, created_at, updated_at) VALUES ${placeholders}`,
        values
      );
    }

    for (const upd of toUpdate) {
      const setSql = UPDATE_FIELDS.map((f) => `${f} = ?`).join(', ');
      const vals = UPDATE_FIELDS.map((f) => upd.values[f]);
      await conn.query(`UPDATE employees SET ${setSql}, updated_at = NOW(6) WHERE id = ?`, [...vals, upd.id]);
    }

    // Re-fetch employees to resolve ids
    const employees = new Map();
    if (codes.length) {
      const [empRows] = await conn.query('SELECT id, employee_id FROM employees WHERE employee_id IN (?)', [codes]);
      for (const e of empRows) employees.set(e.employee_id, e);
    }

    // Build existing training lookup (non-archived) keyed by identity fields.
    const empIds = [...employees.values()].map((e) => e.id);
    const existingByKey = new Map();
    if (empIds.length) {
      const [tRows] = await conn.query(
        `SELECT id, employee_id, title, training_date, take, category, trainer, validity_months,
          validity_days, expiration_date, process_classification, remarks, cert_recert, pass_fail
         FROM trainings WHERE is_archived = 0 AND employee_id IN (?)`,
        [empIds],
      );
      for (const t of tRows) {
        const key = trainingIdentityKey(
          t.employee_id,
          t.title,
          String(t.training_date).slice(0, 10),
          t.take,
        );
        if (!existingByKey.has(key)) existingByKey.set(key, t);
      }
    }

    const trainingsToCreate = [];
    const trainingsToUpdate = [];
    const seenInFile = new Set();

    for (const item of rows) {
      const empCode = item.employee_id;
      const title = cellStr(item.title);
      if (!empCode || !title) {
        if (empCode || title) errors.push({ row: item.row, error: 'Missing ID NO. or TRAINING TITLE' });
        continue;
      }
      const employee = employees.get(empCode);
      if (!employee) {
        errors.push({ row: item.row, error: `Employee ${empCode} could not be created` });
        continue;
      }
      const trainingDate = parseExcelDate(item.training_date);
      if (!trainingDate) {
        errors.push({ row: item.row, error: 'Invalid or missing TRAINING DATE' });
        continue;
      }
      const take = parseTake(item.take);
      const key = trainingIdentityKey(employee.id, title, trainingDate, take);

      if (seenInFile.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      seenInFile.add(key);

      const payload = buildTrainingPayload({ ...item, title }, employee.id, user);
      const existingTraining = existingByKey.get(key);
      if (existingTraining) {
        if (trainingPayloadChanged(existingTraining, payload)) {
          trainingsToUpdate.push({
            id: existingTraining.id,
            category: payload.category,
            trainer: payload.trainer,
            validity_months: payload.validity_months,
            validity_days: payload.validity_days,
            expiration_date: payload.expiration_date,
            process_classification: payload.process_classification,
            remarks: payload.remarks,
            cert_recert: payload.cert_recert,
            pass_fail: payload.pass_fail,
          });
        } else {
          unchangedCount += 1;
        }
        continue;
      }

      trainingsToCreate.push(payload);
    }

    for (const upd of trainingsToUpdate) {
      await conn.query(
        `UPDATE trainings SET
          category = ?, trainer = ?, validity_months = ?, validity_days = ?,
          expiration_date = ?, process_classification = ?, remarks = ?,
          cert_recert = ?, pass_fail = ?,
          updated_at = NOW(6)
         WHERE id = ?`,
        [
          upd.category, upd.trainer, upd.validity_months, upd.validity_days,
          upd.expiration_date, upd.process_classification, upd.remarks,
          upd.cert_recert, upd.pass_fail, upd.id,
        ],
      );
      updatedCount += 1;
    }

    if (trainingsToCreate.length) {
      const cols = ['employee_id', 'title', 'category', 'training_date', 'trainer', 'validity_months',
        'validity_days', 'expiration_date', 'process_classification', 'remarks',
        'worker_line_status', 'cert_recert', 'pass_fail', 'take', 'is_archived', 'created_by'];
      const batchSize = 500;
      for (let i = 0; i < trainingsToCreate.length; i += batchSize) {
        const batch = trainingsToCreate.slice(i, i + batchSize);
        const placeholders = batch.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(6), NOW(6))`).join(', ');
        const values = [];
        for (const t of batch) {
          values.push(
            t.employee_id, t.title, t.category, t.training_date, t.trainer, t.validity_months,
            t.validity_days, t.expiration_date, t.process_classification, t.remarks,
            t.worker_line_status, t.cert_recert, t.pass_fail, t.take, t.created_by
          );
        }
        await conn.query(
          `INSERT INTO trainings (${cols.join(', ')}, created_at, updated_at) VALUES ${placeholders}`,
          values
        );
        createdCount += batch.length;
      }
    }

    await conn.commit();
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    throw e;
  } finally {
    conn.release();
  }

  await logAudit(
    user, 'IMPORT', 'trainings', null,
    `Imported trainings: ${createdCount} created, ${updatedCount} updated, ${unchangedCount} unchanged, ` +
    `${toCreateCount} employees added, ${toUpdateCount} employees updated, ` +
    `${skippedDuplicates} duplicate rows skipped, ${errors.length} row errors`,
  );

  return {
    rows_read: rows.length,
    employees_created: toCreateCount,
    employees_updated: toUpdateCount,
    trainings_created: createdCount,
    trainings_updated: updatedCount,
    trainings_unchanged: unchangedCount,
    duplicates_skipped: skippedDuplicates,
    errors: errors.slice(0, 50),
    error_count: errors.length,
  };
}

async function importExcel({ filename, bytes } = {}) {
  requireRole('admin', 'encoder');
  const name = (filename || '').toLowerCase();
  if (!bytes) throw apiError('Excel file is required', 400);
  if (!(name.endsWith('.xlsx') || name.endsWith('.xlsm'))) {
    throw apiError('Please upload an .xlsx Excel file', 400);
  }
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return importTrainingRecords(data, require('./auth').getCurrentUser());
}

module.exports = {
  importExcel,
  importTrainingRecords,
  readImportRows,
  parseExcelDate,
  parseValidityMonths,
  parseCertRecert,
  parsePassFail,
  trainingIdentityKey,
  buildTrainingPayload,
  trainingPayloadChanged,
};
