# JAE TRMS — Training Records Management System

**JAE Philippines, Inc. — Internal Warehouse Application**

A desktop application for managing employee training and certification records. Runs on the
company's LAN. Every desktop client connects **directly to one shared MySQL server**, so all
laptops see the same records — no separate API server is required.

---

## Platforms

| Role | OS | Guide |
|------|----|-------|
| **Developer** | **macOS** | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| **Server PC** | **Windows** | [deployment/README.md](deployment/README.md) |
| **Warehouse staff** | **Windows laptops** | Install `JAE TRMS Setup.exe` only |

Develop on Mac. Deploy MySQL and the desktop app on Windows.

---

## Architecture

```
Company LAN (192.168.x.x)
│
├── WINDOWS SERVER PC (1 dedicated machine)
│   └── MySQL 8.0  →  database "tcrms"  (TCP 3306)
│
├── WINDOWS LAPTOP 1  →  Electron Desktop App  ──mysql2 / TCP 3306──┐
├── WINDOWS LAPTOP 2  →  Electron Desktop App  ──mysql2 / TCP 3306──┤
└── WINDOWS LAPTOP N  →  Electron Desktop App  ──mysql2 / TCP 3306──┘
```

Staff use the **Electron desktop app**, not a browser. The Electron main process holds a
MySQL connection pool and exposes all data operations to the React UI over IPC. The server
PC only runs MySQL.

---

## Quick Start — Developer (macOS)

You need a local MySQL instance for development.

```bash
npm run install:all

# Create the dev database + user (one-time)
mysql -u root -p <<'SQL'
CREATE DATABASE IF NOT EXISTS tcrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'tcrms_user'@'localhost' IDENTIFIED BY 'tcrms_password';
GRANT ALL PRIVILEGES ON tcrms.* TO 'tcrms_user'@'localhost';
FLUSH PRIVILEGES;
SQL

# Run the desktop app (Vite + Electron)
npm run dev
```

On first launch the **Database Setup** screen appears, prefilled for `localhost`. Click
**Connect to Database** — the app creates the tables and seeds `admin` / `admin123`
automatically. Then log in.

Full guide: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## Quick Start — Production (Windows)

**Server PC:** install MySQL, create the `tcrms` database + user, open TCP `3306` on the
firewall. See [deployment/README.md](deployment/README.md). No application server to run.

**Each warehouse laptop:**

1. Install `JAE TRMS Setup.exe`
2. On first launch: enter the server IP, port `3306`, database `tcrms`, and credentials
3. Log in

Full guide: [deployment/README.md](deployment/README.md)

---

## Building the Windows Installer

Build on a **Windows machine**:

```bash
npm run install:client
npm run dist:win
```

Output: `client/dist-electron/JAE TRMS Setup.exe`

---

## User Roles

| Role | What They Can Do |
|------|-----------------|
| **Admin** | Full access — users, employees, training, reports, archive |
| **Encoder** | Add and edit employees and training records |
| **Viewer** | Read-only public directory (no login required) |

Roles are enforced in the app. See the security note in
[deployment/README.md](deployment/README.md).

---

## File Structure

```
JAE-TCRMS/
├── backend/              Legacy Django REST API + MySQL (kept for reference; not required to run)
├── client/
│   ├── electron/         Electron main process
│   │   └── db/           MySQL pool, schema, and data modules (auth, employees, trainings, ...)
│   └── src/              React + Vite renderer
├── scripts/              Cross-platform npm helpers (Mac + Windows)
├── deployment/           Windows setup (production) + Mac (dev) notes
├── docs/
│   └── DEVELOPMENT.md    Developer guide (macOS)
└── package.json
```

---

## Documentation

| Document | Audience | Contents |
|----------|----------|----------|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Mac developers | Setup, daily workflow, data layer, troubleshooting |
| [deployment/README.md](deployment/README.md) | Windows IT / admin | MySQL install, client deploy, backups |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron (Windows installer) |
| Frontend | React 19 + Tailwind CSS v4 |
| Data layer | Electron main process + `mysql2` connection pool (direct to MySQL) |
| Database | MySQL 8.0 |
| Authentication | bcrypt password check + local session |

---

*JAE Philippines, Inc. — For internal use only. Version 3.0.0*
