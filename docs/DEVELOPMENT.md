# Development Guide (macOS)

This guide is for **developers working on Mac**. End users and production servers run **Windows only**.

## Platform Overview

| Role | OS | What they use |
|------|----|---------------|
| **Developer** | macOS | This guide — local Django + Electron dev |
| **Server PC** | Windows | `deployment/*.bat` scripts |
| **Warehouse staff** | Windows laptops | `JAE TCRMS Setup.exe` desktop app |

You develop on Mac. You ship a **Windows `.exe` installer** and a **Windows server setup** for the warehouse.

---

## Prerequisites (Mac)

Install once:

```bash
# Homebrew packages
brew install node python@3.11 mysql

# Start MySQL locally
brew services start mysql
```

- **Node.js 18+** — for Electron client and npm scripts
- **Python 3.9+** — for Django backend
- **MySQL 8.0+** — local dev database (matches production)

---

## First-Time Setup

```bash
git clone <repo>
cd JAE-TCRMS

# Install backend (Python venv) + client (npm)
npm run install:all

# Create MySQL database, user, and tables
chmod +x deployment/setup-mysql.command
./deployment/setup-mysql.command
```

If your local MySQL root password is not `rootroot`, set it before running setup:

```bash
export MYSQL_ROOT_PASSWORD=your_password
./deployment/setup-mysql.command
```

---

## Daily Development

**Terminal 1 — Django API:**

```bash
npm run server
# → http://localhost:3000
```

**Terminal 2 — Electron client:**

```bash
npm run dev
# → Opens Electron window, connects to localhost:3000
```

Default login: `admin` / `admin123`

---

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run install:backend` | Create venv + install Python deps |
| `npm run install:client` | Install Electron/React deps |
| `npm run server:migrate` | Apply Django migrations |
| `npm run build` | Build client static files (no installer) |
| `npm run dist:win` | Build Windows `.exe` installer |

---

## Building the Windows Installer

End users only run Windows. The installer must be built for Windows:

| Where you build | Command | Output |
|-----------------|---------|--------|
| **Windows PC** (recommended) | `npm run dist:win` | `client/dist-electron/JAE TCRMS Setup.exe` |
| Mac (limited) | Not recommended — NSIS/Windows signing needs a Windows host |

Copy `JAE TCRMS Setup.exe` to warehouse laptops. Staff do **not** need Node, Python, or MySQL on their machines.

---

## Connecting to a Remote Windows Server

During dev you usually use `localhost`. To test against a Windows server on the LAN:

1. Start the Django server on the Windows server PC (`deployment/start-server.bat`)
2. In the Mac Electron app setup screen, enter the server IP (e.g. `192.168.1.10:3000`)

Or clear `localStorage` in the Electron dev tools and re-enter the server URL.

---

## Project Layout (dev-relevant)

```
JAE-TCRMS/
├── backend/              Django API — edit models/views here
├── client/               Electron + React — edit UI here
├── scripts/              Cross-platform npm helpers (Mac + Windows)
├── deployment/           Windows production scripts + Mac .command dev scripts
└── docs/DEVELOPMENT.md   This file
```

---

## Troubleshooting (Mac)

| Problem | Fix |
|---------|-----|
| `mysql: command not found` | `brew install mysql && brew services start mysql` |
| MySQL access denied | Set `MYSQL_ROOT_PASSWORD` or edit `backend/.env` |
| `Backend venv not found` | Run `npm run install:backend` |
| Port 3000 in use | Stop other process or change `PORT` in `backend/.env` |
| Electron blank screen | Ensure `npm run server` is running first |

---

*For Windows server deployment and end-user setup, see [deployment/README.md](../deployment/README.md).*
