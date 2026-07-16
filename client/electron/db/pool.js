'use strict';

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const store = require('./store');
const { apiError } = require('./helpers');

let pool = null;

function normalizeConfig(cfg) {
  cfg = cfg || {};
  return {
    host: (cfg.host || '').trim(),
    port: parseInt(cfg.port, 10) || 3306,
    user: (cfg.user || '').trim(),
    password: cfg.password || '',
    database: (cfg.database || '').trim(),
  };
}

function friendlyDbError(e) {
  const code = e && e.code;
  if (code === 'ECONNREFUSED') return 'Connection refused. Check the host/IP and that MySQL is running and reachable on that port.';
  if (code === 'ETIMEDOUT' || code === 'ENOTFOUND' || code === 'EHOSTUNREACH') return 'Could not reach the database host. Check the IP/hostname and your network.';
  if (code === 'ER_ACCESS_DENIED_ERROR') return 'Access denied. Check the MySQL username and password.';
  if (code === 'ER_BAD_DB_ERROR') return 'Database not found. Check the database name.';
  return (e && e.message) ? e.message : 'Could not connect to the database.';
}

function buildPool(cfg) {
  const c = normalizeConfig(cfg);
  return mysql.createPool({
    host: c.host,
    port: c.port,
    user: c.user,
    password: c.password,
    database: c.database,
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4',
    dateStrings: true,     // DATE -> 'YYYY-MM-DD', DATETIME -> 'YYYY-MM-DD HH:MM:SS' (no tz shift)
    decimalNumbers: true,  // DECIMAL -> JS number
    multipleStatements: false,
    enableKeepAlive: true,
  });
}

async function testConnection(cfg) {
  const c = normalizeConfig(cfg);
  if (!c.host || !c.user || !c.database) {
    throw apiError('Host, username, and database are required.', 400);
  }
  let conn;
  try {
    conn = await mysql.createConnection({
      host: c.host,
      port: c.port,
      user: c.user,
      password: c.password,
      database: c.database,
      connectTimeout: 8000,
    });
    await conn.query('SELECT 1');
  } catch (e) {
    throw apiError(friendlyDbError(e), 400);
  } finally {
    if (conn) { try { await conn.end(); } catch (_) {} }
  }
  return true;
}

async function setPool(cfg) {
  await closePool();
  pool = buildPool(cfg);
  try {
    schemaReady = false;
    await ensureSchemaReady();
    await seedAdmin();
  } catch (e) {
    await closePool();
    throw apiError(friendlyDbError(e), 400);
  }
  return pool;
}

async function initFromStore() {
  const cfg = store.getDbConfig();
  if (!cfg) return null;
  try {
    return await setPool(cfg);
  } catch (e) {
    console.error('Failed to initialize DB pool from saved config:', e.message);
    return null;
  }
}

function getPool() {
  if (!pool) throw apiError('Database is not configured. Open Setup to connect.', 503);
  return pool;
}

function isConfigured() {
  return !!pool;
}

async function closePool() {
  if (pool) {
    try { await pool.end(); } catch (_) {}
    pool = null;
  }
  schemaReady = false;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS employees (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    middle_initial VARCHAR(10) NOT NULL DEFAULT '',
    full_name VARCHAR(255) NOT NULL,
    factory VARCHAR(100) NOT NULL DEFAULT '',
    line VARCHAR(100) NOT NULL DEFAULT '',
    team VARCHAR(100) NOT NULL DEFAULT '',
    position VARCHAR(100) NOT NULL DEFAULT '',
    employment_status VARCHAR(50) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    hire_date DATE NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_employees_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS trainings (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT '',
    training_date DATE NOT NULL,
    trainer VARCHAR(255) NOT NULL DEFAULT '',
    validity_months DECIMAL(4,1) NULL DEFAULT 12.0,
    validity_days INT UNSIGNED NULL,
    expiration_date DATE NULL,
    process_classification VARCHAR(255) NOT NULL DEFAULT '',
    remarks LONGTEXT NOT NULL,
    worker_line_status VARCHAR(50) NOT NULL DEFAULT 'Floating',
    cert_uncert VARCHAR(20) NOT NULL DEFAULT 'CERT',
    pass_fail VARCHAR(20) NOT NULL DEFAULT 'Passed',
    take INT UNSIGNED NOT NULL DEFAULT 1,
    is_archived TINYINT(1) NOT NULL DEFAULT 0,
    archived_at DATETIME(6) NULL,
    created_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_trainings_employee (employee_id),
    INDEX idx_trainings_expiration (expiration_date),
    CONSTRAINT fk_trainings_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_trainings_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    username VARCHAR(150) NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NULL,
    details LONGTEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_audit_created (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function ensureSchema() {
  for (const ddl of SCHEMA) {
    await pool.query(ddl);
  }
  // Additive migrations for existing databases (CREATE TABLE IF NOT EXISTS won't alter columns)
  const additive = [
    `ALTER TABLE trainings ADD COLUMN cert_uncert VARCHAR(20) NOT NULL DEFAULT 'CERT'`,
    `ALTER TABLE trainings ADD COLUMN pass_fail VARCHAR(20) NOT NULL DEFAULT 'Passed'`,
  ];
  for (const sql of additive) {
    try {
      await pool.query(sql);
    } catch (e) {
      if (e && e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
  }
}

let schemaReady = false;

async function ensureSchemaReady() {
  if (schemaReady || !pool) return;
  await ensureSchema();
  schemaReady = true;
}

async function seedAdmin() {
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM users');
  if (Number(rows[0].c) > 0) return;
  const hash = bcrypt.hashSync('admin123', 10);
  await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', NOW(6), NOW(6))`,
    ['admin', hash, 'System Administrator', 'admin']
  );
  console.log('Seeded default admin account (admin / admin123). Change the password after first login.');
}

module.exports = {
  buildPool,
  testConnection,
  setPool,
  initFromStore,
  getPool,
  ensureSchemaReady,
  isConfigured,
  closePool,
  friendlyDbError,
  normalizeConfig,
};
