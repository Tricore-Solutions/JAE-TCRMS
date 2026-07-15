'use strict';

const { getPool, isConfigured } = require('./pool');
const { logAudit } = require('./audit');

const RETENTION_DAYS = 730; // ~2 years
const DAY_MS = 24 * 60 * 60 * 1000;

function cutoffString() {
  const d = new Date(Date.now() - RETENTION_DAYS * DAY_MS);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function runPurge() {
  if (!isConfigured()) return { count: 0 };
  const pool = getPool();
  const cutoff = cutoffString();

  const [rows] = await pool.query(
    'SELECT COUNT(*) AS c FROM trainings WHERE is_archived = 1 AND archived_at IS NOT NULL AND archived_at < ?',
    [cutoff]
  );
  const count = Number(rows[0].c);
  if (count > 0) {
    await pool.query(
      'DELETE FROM trainings WHERE is_archived = 1 AND archived_at IS NOT NULL AND archived_at < ?',
      [cutoff]
    );
    await logAudit(
      { username: 'system' }, 'PURGE', 'trainings', null,
      `Auto-purged ${count} archived training record(s) older than ${RETENTION_DAYS} days`
    );
    console.log(`Purge: removed ${count} archived training(s) older than ${RETENTION_DAYS} days.`);
  }
  return { count };
}

let timer = null;

function start() {
  stop();
  // Run shortly after startup, then every 24h.
  setTimeout(() => {
    runPurge().catch((e) => console.error('Purge failed:', e.message));
  }, 10 * 1000);
  timer = setInterval(() => {
    runPurge().catch((e) => console.error('Purge failed:', e.message));
  }, DAY_MS);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { runPurge, start, stop };
