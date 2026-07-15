'use strict';

const pool = require('./pool');
const store = require('./store');
const auth = require('./auth');
const employees = require('./employees');
const trainings = require('./trainings');
const users = require('./users');
const reports = require('./reports');
const publicApi = require('./public');
const importer = require('./import');
const purge = require('./purge');
const { apiError } = require('./helpers');

// ---- Connection / setup ops --------------------------------------------------

async function getDb() {
  return store.getDbConfig();
}

async function status() {
  return { configured: pool.isConfigured() };
}

async function testDb(payload) {
  await pool.testConnection(payload || {});
  return true;
}

async function setDb(payload) {
  await pool.setPool(payload || {});
  store.setDbConfig(pool.normalizeConfig(payload || {}));
  purge.start();
  return { configured: true };
}

async function clearDb() {
  purge.stop();
  auth.clearCurrentUser();
  await pool.closePool();
  store.clearDbConfig();
  store.clearSession();
  return { cleared: true };
}

const handlers = {
  // connection / setup
  'config.getDb': getDb,
  'config.setDb': setDb,
  'config.clearDb': clearDb,
  'db.test': testDb,
  'db.status': status,

  // auth
  'auth.login': (p) => auth.login(p),
  'auth.me': () => auth.me(),
  'auth.logout': () => auth.logout(),

  // employees
  'employees.list': (p) => employees.list(p),
  'employees.filters': () => employees.filters(),
  'employees.get': (p) => employees.get(p),
  'employees.create': (p) => employees.create(p),
  'employees.update': (p) => employees.update(p),
  'employees.remove': (p) => employees.remove(p),

  // trainings
  'trainings.list': (p) => trainings.list(p),
  'trainings.summary': () => trainings.summary(),
  'trainings.categories': () => trainings.categories(),
  'trainings.titles': () => trainings.titles(),
  'trainings.get': (p) => trainings.get(p),
  'trainings.create': (p) => trainings.create(p),
  'trainings.update': (p) => trainings.update(p),
  'trainings.remove': (p) => trainings.remove(p),
  'trainings.archived': () => trainings.archived(),
  'trainings.restore': (p) => trainings.restore(p),
  'trainings.deletePermanent': (p) => trainings.deletePermanent(p),
  'trainings.bulkArchive': (p) => trainings.bulkArchive(p),
  'trainings.bulkRestore': (p) => trainings.bulkRestore(p),
  'trainings.bulkDelete': (p) => trainings.bulkDelete(p),
  'trainings.import': (p) => importer.importExcel(p),

  // users
  'users.list': () => users.list(),
  'users.get': (p) => users.get(p),
  'users.create': (p) => users.create(p),
  'users.update': (p) => users.update(p),
  'users.remove': (p) => users.remove(p),

  // reports
  'reports.overview': () => reports.overview(),
  'reports.byCategory': () => reports.byCategory(),
  'reports.byFactory': () => reports.byFactory(),
  'reports.expiring': (p) => reports.expiring(p),
  'reports.auditLogs': (p) => reports.auditLogs(p),
  'reports.recordLogs': (p) => reports.recordLogs(p),
  'reports.exportTrainings': (p) => reports.exportTrainings(p),
  'reports.takesPerMonth': () => reports.takesPerMonth(),

  // public / viewer
  'public.employees': (p) => publicApi.employees(p),
  'public.trainingTitles': () => publicApi.trainingTitles(),
  'public.employeeTrainings': (p) => publicApi.employeeTrainings(p),
};

async function call(op, payload) {
  const handler = handlers[op];
  if (!handler) throw apiError(`Unknown operation: ${op}`, 400);
  return handler(payload);
}

// Called from main once the app is ready.
async function bootstrap() {
  const p = await pool.initFromStore();
  if (p) purge.start();
  return !!p;
}

module.exports = { call, bootstrap };
