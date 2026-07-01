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

Staff use the **desktop app only** — no browser, no Python, no MySQL on their laptops.

---

## Server PC — First-Time Setup

Run these **in order** on the Windows server machine:

### 1. Install prerequisites

- [Python 3.9+](https://python.org) — check **"Add Python to PATH"**
- [MySQL 8.0+](https://dev.mysql.com/downloads/installer/)

### 2. Install backend

Double-click `deployment/install-backend.bat`

Creates the Python virtual environment and installs Django dependencies.

### 3. Set up database

Double-click `deployment/setup-mysql.bat`

Creates the `tcrms` database, `tcrms_user`, and runs migrations.

Default credentials (change in production via `backend/.env`):

| Setting | Value |
|---------|-------|
| Database | `tcrms` |
| User | `tcrms_user` |
| Password | `tcrms_password` |
| Port | `3306` |

### 4. Allow firewall

Run in **Administrator** Command Prompt:

```
netsh advfirewall firewall add rule name="JAE TCRMS Server" dir=in action=allow protocol=TCP localport=3000
```

### 5. Start the server

Double-click `deployment/start-server.bat`

Verify: open http://localhost:3000/health — should show `"status": "ok"`.

Note the server PC's LAN IP (e.g. `192.168.1.10`) — all laptops need this.

### 6. Auto-start on boot (optional)

Double-click `deployment/setup-autostart.bat`

---

## Warehouse Laptops — Client Setup

Staff laptops need **only the desktop app**.

1. Copy `JAE TCRMS Setup.exe` to each laptop (build on Windows — see below)
2. Run the installer
3. **First launch:** the **Server Setup** screen appears — enter the server PC's IP and port `3000`
4. Log in with credentials from the admin

> The Server Setup screen appears once per laptop. The app saves the server address locally. It does **not** appear in Mac dev mode (auto-connects to localhost).

---

## Daily Operations (Server PC)

| Task | Action |
|------|--------|
| Start server | Double-click `start-server.bat` |
| Stop server | Close the command window or Ctrl+C |
| Backup database | `mysqldump -u tcrms_user -p tcrms > backup.sql` |
| Restore database | `mysql -u tcrms_user -p tcrms < backup.sql` |

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
| `setup-autostart.bat` | Windows | Start server on Windows login |
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

Distribute this file to all warehouse laptops. Staff do not need Node, Python, or MySQL.

---

## Troubleshooting (Windows)

| Problem | Fix |
|---------|-----|
| Client "Cannot connect to server" | Confirm `start-server.bat` is running; check firewall rule |
| Wrong server IP on laptop | Delete app data / reinstall, or clear saved config on re-setup |
| MySQL connection failed on server | Verify MySQL service is running; check `backend/.env` |
| Port 3000 blocked | Run the firewall command above |
| Health check fails | Run `setup-mysql.bat` again; check MySQL credentials in `.env` |

---

*For Mac development setup, see [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md).*
