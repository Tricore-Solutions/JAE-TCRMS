const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_DIR = process.env.DB_PATH || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'tcrms.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_FILE);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      password_hash TEXT  NOT NULL,
      full_name   TEXT    NOT NULL DEFAULT '',
      role        TEXT    NOT NULL CHECK(role IN ('admin','encoder','viewer')),
      status      TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id   TEXT    NOT NULL UNIQUE,
      full_name     TEXT    NOT NULL,
      factory       TEXT    NOT NULL DEFAULT '',
      line          TEXT    NOT NULL DEFAULT '',
      team          TEXT    NOT NULL DEFAULT '',
      position      TEXT    NOT NULL DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','resigned')),
      hire_date     TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trainings (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id           INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title                 TEXT    NOT NULL,
      category              TEXT    NOT NULL DEFAULT '',
      training_date         TEXT    NOT NULL,
      trainer               TEXT    NOT NULL DEFAULT '',
      validity_months       INTEGER NOT NULL DEFAULT 12,
      expiration_date       TEXT,
      process_classification TEXT   NOT NULL DEFAULT '',
      remarks               TEXT    NOT NULL DEFAULT '',
      created_by            INTEGER REFERENCES users(id),
      created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER REFERENCES users(id),
      username    TEXT,
      action      TEXT    NOT NULL,
      table_name  TEXT    NOT NULL,
      record_id   INTEGER,
      details     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_trainings_employee ON trainings(employee_id);
    CREATE INDEX IF NOT EXISTS idx_trainings_expiration ON trainings(expiration_date);
    CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (userCount.cnt > 0) return;

  const adminHash = bcrypt.hashSync('admin123', 10);

  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role) VALUES
    ('admin', ?, 'System Administrator', 'admin')
  `).run(adminHash);

  console.log('Default admin account created. Username: admin / Password: admin123');
  console.log('IMPORTANT: Change the default password after first login.');
}

initSchema();
seedData();

module.exports = db;
