# JAE TCRMS — Training and Certification Record Management System

**JAE Philippines, Inc. — Internal Warehouse Application**

A desktop application for managing employee training and certification records. Runs on the company's LAN with a central backend server. Data syncs across all connected desktop clients via REST API.

---

## Platforms

| Role | OS | Guide |
|------|----|-------|
| **Developer** | **macOS** | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| **Server PC** | **Windows** | [deployment/README.md](deployment/README.md) |
| **Warehouse staff** | **Windows laptops** | Install `JAE TCRMS Setup.exe` only |

Develop on Mac. Deploy the server and desktop app on Windows.

---

## Architecture

```
Company LAN (192.168.x.x)
│
├── WINDOWS SERVER PC (1 dedicated machine)
│   ├── Django REST API  →  port 3000
│   └── MySQL Database   →  tcrms
│
├── WINDOWS LAPTOP 1  →  Electron Desktop App  ──HTTP API──┐
├── WINDOWS LAPTOP 2  →  Electron Desktop App  ──HTTP API──┤
└── WINDOWS LAPTOP N  →  Electron Desktop App  ──HTTP API──┘
```

Staff use the **Electron desktop app**, not a browser. The app connects to the central Django API over HTTP on the LAN.

---

## Quick Start — Developer (macOS)

```bash
npm run install:all
chmod +x deployment/setup-mysql.command
export MYSQL_ROOT_PASSWORD='your_mysql_root_password'   # if needed
./deployment/setup-mysql.command

# Terminal 1 — API
npm run server

# Terminal 2 — desktop app
npm run dev
```

- API health check: http://localhost:3000/health
- App UI: Electron window (or http://localhost:5173 during dev)
- Login: `admin` / `admin123`

In dev, the app auto-connects to `localhost:3000` — no Server Setup screen needed if the backend is running.

Full guide: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## Quick Start — Production (Windows)

**Server PC:**

1. `deployment/install-backend.bat`
2. `deployment/setup-mysql.bat`
3. `deployment/start-server.bat`

**Each warehouse laptop:**

1. Install `JAE TCRMS Setup.exe`
2. On first launch: enter server IP + port `3000`
3. Log in

Full guide: [deployment/README.md](deployment/README.md)

---

## Building the Windows Installer

Build on a **Windows machine**:

```bash
npm run install:client
npm run dist:win
```

Output: `client/dist-electron/JAE TCRMS Setup.exe`

---

## User Roles

| Role | What They Can Do |
|------|-----------------|
| **Admin** | Full access — users, employees, training, reports |
| **Encoder** | Add and edit employees and training records |
| **Viewer** | Read-only public directory (no login required) |

---

## File Structure

```
JAE-TCRMS/
├── backend/              Django REST API + MySQL
├── client/               Electron desktop app (React + Vite)
├── scripts/              Cross-platform npm helpers (Mac + Windows)
├── deployment/           Windows .bat (production) + Mac .command (dev)
├── docs/
│   └── DEVELOPMENT.md    Developer guide (macOS)
└── package.json
```

---

## Documentation

| Document | Audience | Contents |
|----------|----------|----------|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Mac developers | Setup, daily workflow, ports, API, troubleshooting |
| [deployment/README.md](deployment/README.md) | Windows IT / admin | Server install, client deploy, backups |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron (Windows installer) |
| Frontend | React 19 + Tailwind CSS v4 |
| Backend | Django 4.2 + Django REST Framework |
| Database | MySQL 8.0 |
| Authentication | JWT + bcrypt |

---

*JAE Philippines, Inc. — For internal use only. Version 2.0.0*
