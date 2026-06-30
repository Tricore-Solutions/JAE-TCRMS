# JAE TCRMS — Windows Deployment

Production deployment for **Windows only**. Developers work on Mac — see [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md).

## Who Uses What

| Machine | OS | Software |
|---------|-----|----------|
| **Server PC** (1 per site) | Windows | Python, MySQL, Django API |
| **Warehouse laptops** (all staff) | Windows | JAE TCRMS desktop app (`.exe`) |
| **Developer** | macOS | Not used in production |

---

## Architecture

```
Company LAN
├── Windows Server PC
│   ├── MySQL 8.0 (local)
│   └── Django REST API (port 3000)
└── Windows Laptops
    └── JAE TCRMS Setup.exe → HTTP API
```

Staff never open a browser. The desktop app syncs data through the central API.

---

## Server PC — First-Time Setup

Run these in order on the **Windows server machine**:

### 1. Install prerequisites

- [Python 3.9+](https://python.org) — check **"Add Python to PATH"**
- [MySQL 8.0+](https://dev.mysql.com/downloads/installer/)

### 2. Install backend

Double-click:

```
deployment/install-backend.bat
```

Creates Python venv and installs Django dependencies.

### 3. Set up database

Double-click:

```
deployment/setup-mysql.bat
```

Creates `tcrms` database, `tcrms_user`, and runs migrations.

Default credentials (change in production via `backend/.env`):

| Setting | Value |
|---------|-------|
| Database | `tcrms` |
| User | `tcrms_user` |
| Password | `tcrms_password` |

### 4. Allow firewall

Run in **Administrator** Command Prompt:

```
netsh advfirewall firewall add rule name="JAE TCRMS Server" dir=in action=allow protocol=TCP localport=3000
```

### 5. Start the server

Double-click:

```
deployment/start-server.bat
```

Health check: `http://localhost:3000/health`

Note the server PC's LAN IP (e.g. `192.168.1.10`) — clients need this.

### 6. Auto-start on boot (optional)

Double-click:

```
deployment/setup-autostart.bat
```

---

## Warehouse Laptops — Client Setup

Staff laptops need **only the desktop app** — no Python, Node, or MySQL.

1. Copy `JAE TCRMS Setup.exe` to each laptop (built on a Windows machine — see dev guide)
2. Run the installer
3. On first launch, enter server IP + port `3000`
4. Log in with credentials from the admin

---

## Daily Operations (Server PC)

| Task | Action |
|------|--------|
| Start server | Double-click `start-server.bat` |
| Stop server | Close the command window or Ctrl+C |
| Backup database | `mysqldump -u tcrms_user -p tcrms > backup.sql` |

---

## Default Login

After first migration:

- Username: `admin`
- Password: `admin123`

Change immediately after first login.

---

## Script Reference

| Script | Platform | Purpose |
|--------|----------|---------|
| `install-backend.bat` | Windows | First-time Python/Django setup |
| `setup-mysql.bat` | Windows | Create DB + migrate |
| `start-server.bat` | Windows | Run API server |
| `setup-autostart.bat` | Windows | Start server on login |
| `setup-mysql.command` | macOS (dev) | Local dev database setup |
| `start-server.command` | macOS (dev) | Local dev server |

---

## Building the Client Installer (Windows)

On a Windows machine with Node.js 18+:

```bash
npm run install:client
npm run dist:win
```

Output: `client/dist-electron/JAE TCRMS Setup.exe`

Distribute this file to all warehouse laptops.
