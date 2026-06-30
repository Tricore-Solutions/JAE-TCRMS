/**
 * Create backend venv and install Python dependencies (Mac + Windows).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');
const isWin = process.platform === 'win32';
const venvDir = path.join(backendDir, 'venv');
const venvPython = isWin
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');
const systemPython = isWin ? 'python' : 'python3';

function run(cmd, args, cwd = backendDir) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Setting up backend (${isWin ? 'Windows' : process.platform})...`);

if (!fs.existsSync(venvPython)) {
  console.log('Creating Python virtual environment...');
  run(systemPython, ['-m', 'venv', 'venv']);
}

console.log('Installing Python dependencies...');
run(venvPython, ['-m', 'pip', 'install', '-r', 'requirements.txt']);

if (!fs.existsSync(path.join(backendDir, '.env'))) {
  fs.copyFileSync(
    path.join(backendDir, '.env.example'),
    path.join(backendDir, '.env'),
  );
  console.log('Created backend/.env from .env.example');
}

console.log('Backend setup complete.');
