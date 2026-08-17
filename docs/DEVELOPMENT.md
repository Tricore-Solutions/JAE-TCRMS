# Development Guide (macOS)

This guide is for **developers working on Mac**. End users and production servers run **Windows only**.

## Platform Overview

| Role | OS | What they use |
|------|----|---------------|
| **Developer** | macOS | This guide — local Django + Electron dev |
| **Server PC** | Windows | `deployment/*.bat` scripts |
| **Warehouse staff** | Windows laptops | `JAE TRMS Setup.exe` desktop app |

You develop on Mac. You ship a **Windows `.exe` installer** and a **Windows server setup** for the warehouse.

---

## Prerequisites (Mac)

Install once:

```bash
brew install node python@3.11 mysql
brew services start mysql
```

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Electron client, npm scripts |
| Python | 3.9+ | Django backend |
| MySQL | 8.0+ | Local dev database (matches production) |

> **Note:** If you already have MySQL installed from [mysql.com](https://dev.mysql.com/downloads/) (Oracle installer), that works too. You do not need Homebrew MySQL unless you prefer it. Use the root password you set during that installation.

---

## First-Time Setup

```bash
git clone <repo>
cd JAE-TCRMS

npm run install:all

chmod +x deployment/setup-mysql.command deployment/start-server.command
./deployment/setup-mysql.command
```

### MySQL root password

The setup script tries to connect as MySQL `root`. If the default does not work, set your password first:

```bash
export MYSQL_ROOT_PASSWORD='your_mysql_root_password'
./deployment/setup-mysql.command
```

### Environment file

If `backend/.env` does not exist yet:

```bash
cp backend/.env.example backend/.env
```

You do **not** need to activate the Python venv manually — all `npm run` commands use it automatically.

---

## Daily Development

**Terminal 1 — Django API:**

```bash
npm run server
```

**Terminal 2 — Electron desktop app:**

```bash
npm run dev
```

On first `npm run dev`, Electron may download its binary (~100MB). Wait until Terminal 2 finishes — the desktop window opens when ready.

Default login: `admin` / `admin123`

---

## Dev URLs — Important

During development there are **three** things running. Do not confuse them:

| URL / Window | What it is | What you see |
|--------------|------------|--------------|
| http://localhost:3000 | Django **API** (backend) | JSON only — this is normal |
| http://localhost:3000/health | API health check | `{"status":"ok",...}` |
| http://localhost:5173 | Vite **UI** (browser dev) | Login screen — optional during dev |
| **Electron window** | Desktop app | Same UI as :5173 — primary dev target |

**Port 3000 is not the app UI.** Use the Electron window or `:5173` for the interface.

### First launch in dev

In development mode, the app **auto-connects** to `http://localhost:3000` if the backend is running. You should go straight to the **Login** screen.

The **Server Setup** page only appears if:
- The backend is not running when the app starts, or
- You are running a **production build** (Windows `.exe`)

To test Setup manually in dev: open DevTools → Application → Local Storage → delete `serverUrl` → refresh.

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run install:all` | Install backend (venv) + client deps |
| `npm run install:backend` | Python venv + Django deps only |
| `npm run install:client` | Electron/React deps only |
| `npm run server` | Start Django API on port 3000 |
| `npm run server:migrate` | Apply database migrations |
| `npm run dev` | Start Vite + Electron (desktop app) |
| `npm run build` | Build client static files (no installer) |
| `npm run dist:win` | Build Windows `.exe` installer |

### Manual Django commands (optional)

Only if you need to run Django directly:

```bash
source backend/venv/bin/activate
cd backend
python manage.py migrate
python manage.py seed_admin
deactivate
```

---

## Building the Windows Installer

End users only run Windows. Build the installer on a **Windows PC**:

```bash
npm run install:client
npm run dist:win
```

Output: `client/dist-electron/JAE TRMS Setup.exe`

Mac cannot reliably produce the NSIS Windows installer — use a Windows machine for releases.

---

## Connecting to a Remote Windows Server

To test the Mac client against a Windows server on the LAN:

1. Start Django on the Windows server (`deployment/start-server.bat`)
2. Delete `serverUrl` from localStorage in the Electron app
3. On the Setup screen, enter the server IP (e.g. `192.168.1.10`) and port `3000`

---

## Project Layout

```
JAE-TCRMS/
├── backend/              Django API — models, views, serializers
│   ├── api/              Main app (employees, trainings, users, reports)
│   ├── tcrms/            Django settings
│   └── venv/             Python virtual environment (auto-used by npm)
├── client/               Electron + React — UI pages and components
│   ├── src/pages/        App screens
│   ├── src/api/          Axios API client
│   └── electron/         Desktop shell
├── scripts/              Cross-platform npm helpers
├── deployment/           Windows .bat + Mac .command scripts
└── docs/DEVELOPMENT.md   This file
```

---

## API Overview

The Electron client talks to Django via REST. Base URL: `http://<server>:3000/api/`

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | No | Server + database health |
| `POST /api/auth/login` | No | Login → JWT token |
| `GET /api/auth/me` | Yes | Current user |
| `/api/employees` | Yes | Employee CRUD |
| `/api/trainings` | Yes | Training record CRUD |
| `/api/users` | Yes | User management (admin) |
| `/api/reports/*` | Yes | Dashboard stats, exports |
| `GET /api/public/employees` | No | Public viewer directory |

---

## Troubleshooting (Mac)

| Problem | Fix |
|---------|-----|
| `mysql: command not found` | `brew install mysql && brew services start mysql` |
| MySQL access denied on setup | `export MYSQL_ROOT_PASSWORD='your_password'` then rerun setup script |
| `Backend venv not found` | `npm run install:backend` |
| Port 3000 in use | Stop other process or change `PORT` in `backend/.env` |
| Browser shows JSON at :3000 | Expected — API only. Use Electron or `:5173` for UI |
| Electron stuck on "Downloading..." | First run only — wait for download to finish |
| Setup page in dev | Start `npm run server` first, then refresh the app |
| Cannot connect to server | Confirm Terminal 1 is running and `/health` returns `"status":"ok"` |

---

*For Windows server deployment and end-user setup, see [deployment/README.md](../deployment/README.md).*
