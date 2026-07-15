'use strict';

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function configFile() {
  return path.join(app.getPath('userData'), 'config.json');
}

function load() {
  try {
    const file = configFile();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to read config:', e);
  }
  return {};
}

function save(config) {
  try {
    const file = configFile();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to write config:', e);
    return false;
  }
}

function getDbConfig() {
  return load().db || null;
}

function setDbConfig(db) {
  const config = load();
  config.db = db;
  return save(config);
}

function clearDbConfig() {
  const config = load();
  delete config.db;
  delete config.session;
  return save(config);
}

function getSession() {
  return load().session || null;
}

function setSession(session) {
  const config = load();
  config.session = session;
  return save(config);
}

function clearSession() {
  const config = load();
  delete config.session;
  return save(config);
}

module.exports = {
  load,
  save,
  getDbConfig,
  setDbConfig,
  clearDbConfig,
  getSession,
  setSession,
  clearSession,
};
