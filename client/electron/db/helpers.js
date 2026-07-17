'use strict';

// Error carrying an HTTP-like status so the renderer can reproduce axios-style errors.
function apiError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function userDisplayName(user, fallback = null) {
  if (user) {
    const name = (user.full_name || '').trim();
    if (name) return name;
    if (user.username) return user.username;
  }
  return fallback || 'Unknown';
}

// ---- Date helpers (date-only, no timezone shifting) --------------------------

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISO(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function parseISO(value) {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

function daysInMonth(year, month) {
  // month is 1-12
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addDays(y, m, d, days) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

// Local (laptop) date, matching Django's timezone.localdate()
function today() {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function daysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// Normalize a DATETIME string ('YYYY-MM-DD HH:MM:SS') to ISO-with-T so the
// renderer's `.split('T')[0]` keeps working. Returns null for empty values.
function dt(value) {
  if (value === null || value === undefined || value === '') return null;
  return String(value).replace(' ', 'T');
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format a stored datetime like Python's '%b %d, %Y %I:%M %p' -> "Jan 05, 2024 03:07 PM"
function formatAuditDate(value) {
  if (!value) return '';
  const s = String(value).replace('T', ' ');
  const [datePart, timePart = '00:00:00'] = s.split(' ');
  const { y, m, d } = parseISO(datePart);
  const [hhRaw, mm] = timePart.split(':');
  let hh = parseInt(hhRaw, 10);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${MONTH_NAMES_SHORT[m - 1]} ${pad(d)}, ${y} ${pad(hh)}:${mm} ${ampm}`;
}

// Faithful port of api/utils.calc_expiration -> returns 'YYYY-MM-DD' string or null.
function calcExpiration(trainingDate, validityMonths = null, validityDays = null) {
  if (!trainingDate) return null;
  const { y, m, d } = parseISO(String(trainingDate));

  if (validityDays) {
    const r = addDays(y, m, d, parseInt(validityDays, 10));
    return toISO(r.y, r.m, r.d);
  }

  if (validityMonths === null || validityMonths === undefined || Number(validityMonths) === 0) {
    return null;
  }

  const months = Number(validityMonths);
  const whole = Math.trunc(months);
  const frac = months - whole;
  const monthIndex = y * 12 + (m - 1) + whole;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  const maxDay = daysInMonth(year, month);
  const day = Math.min(d, maxDay);
  let res = { y: year, m: month, d: day };
  if (frac) {
    const dim = daysInMonth(res.y, res.m);
    res = addDays(res.y, res.m, res.d, Math.round(dim * frac));
  }
  return toISO(res.y, res.m, res.d);
}

// Faithful port of api/utils.parse_training_validity
function parseTrainingValidity(data, defaultMonths = 12) {
  const hasDays = Object.prototype.hasOwnProperty.call(data, 'validity_days');
  const validityDays = hasDays ? data.validity_days : null;
  if (validityDays) {
    return { validity_months: null, validity_days: parseInt(validityDays, 10) };
  }
  if (Object.prototype.hasOwnProperty.call(data, 'validity_months')) {
    let vm = data.validity_months;
    if (vm === null || vm === undefined) return { validity_months: null, validity_days: null };
    vm = Number(vm);
    if (vm === 0) return { validity_months: 0, validity_days: null };
    return { validity_months: vm, validity_days: null };
  }
  return { validity_months: Number(defaultMonths), validity_days: null };
}

function normalizeCertRecert(value) {
  const text = String(value == null ? '' : value).trim().toUpperCase().replace(/[\s-]+/g, '');
  if (text === 'RECERT' || text === 'UNCERT' || text === 'UN') return 'RE-CERT';
  return 'CERT';
}

module.exports = {
  apiError,
  userDisplayName,
  toISO,
  parseISO,
  daysInMonth,
  addDays,
  today,
  daysFromToday,
  dt,
  formatAuditDate,
  calcExpiration,
  parseTrainingValidity,
  MONTH_NAMES_SHORT,
  normalizeCertRecert,
};
