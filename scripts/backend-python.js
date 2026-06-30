/**
 * Cross-platform helper to run the backend Python interpreter from venv.
 * Usage: node scripts/backend-python.js manage.py migrate
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');
const isWin = process.platform === 'win32';
const venvPython = isWin
  ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
  : path.join(backendDir, 'venv', 'bin', 'python');

const systemPython = isWin ? 'python' : 'python3';
const python = fs.existsSync(venvPython) ? venvPython : systemPython;

if (!fs.existsSync(venvPython)) {
  console.warn('Backend venv not found — using system Python. Run: npm run install:backend');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/backend-python.js <command> [args...]');
  process.exit(1);
}

const result = spawnSync(python, args, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: isWin,
});

process.exit(result.status ?? 1);
