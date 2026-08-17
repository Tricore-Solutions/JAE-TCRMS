# JAE TRMS — Windows Deployment

Production deployment for **Windows only**. Developers work on Mac — see [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md).

The desktop app now connects **directly to a shared MySQL server** over the LAN.
There is **no Django/Python API to run anymore** — the server PC only needs MySQL.

## Who Uses What

| Machine | OS | Software |
|---------|-----|----------|
| **Server PC** (1 per site) | Windows | MySQL 8.0 only |
| **Warehouse laptops** (all staff) | Windows | JAE TRMS desktop app (`.exe`) |
| **Developer** | macOS | Not used in production |

---

## Architecture

```
Company LAN
├── Windows Server PC
│   └── MySQL 8.0  →  database "tcrms"  (TCP 3306)
└── Windows Laptops
    └── JAE TRMS Setup.exe  ──(mysql2, TCP 3306)──►  MySQL
```

Each laptop's Electron app talks straight to MySQL. Staff use the **desktop app only** —
no browser, no Python, no MySQL on their laptops.

---

## Server PC — First-Time Setup

Run these **in order** on the Windows server machine:

### 1. Install MySQL

- [MySQL 8.0+](https://dev.mysql.com/downloads/installer/)

During install, set a root password you will remember.

### 2. Allow LAN connections

By default MySQL only listens on `localhost`. Edit `my.ini` (usually
`C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`) and set:

```
bind-address = 0.0.0.0
```

Then restart the **MySQL80** service (Services app, or `net stop MySQL80 && net start MySQL80`).

### 3. Create the database and user

Open **MySQL Command Line Client** (or `mysql -u root -p`) and run:

```sql
CREATE DATABASE tcrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tcrms_user'@'%' IDENTIFIED BY 'tcrms_password';
GRANT ALL PRIVILEGES ON tcrms.* TO 'tcrms_user'@'%';
FLUSH PRIVILEGES;
```

Default credentials (change the password in production):

| Setting | Value |
|---------|-------|
| Database | `tcrms` |
| User | `tcrms_user` |
| Password | `tcrms_password` |
| Port | `3306` |

> **Tables are created automatically.** The first time a laptop connects, the app
> creates the `users`, `employees`, `trainings`, and `audit_logs` tables if they don't
> already exist, and seeds the default `admin` / `admin123` account when the `users`
> table is empty. You do **not** need to run Django migrations. If you are migrating
> from the old API-based version, point the app at the existing `tcrms` database — the
> existing data and bcrypt password hashes keep working untouched.

### 4. Allow firewall

Run in **Administrator** Command Prompt:

```
netsh advfirewall firewall add rule name="JAE TRMS MySQL" dir=in action=allow protocol=TCP localport=3306
```

Note the server PC's LAN IP (e.g. `192.168.1.10`) — all laptops need this.

---

## Warehouse Laptops — Client Setup

Staff laptops need **only the desktop app**.

1. Copy `JAE TRMS Setup.exe` to each laptop (build on Windows — see below)
2. Run the installer
3. **First launch:** the **Database Setup** screen appears. Enter:
   - **Server IP / Host** — the server PC's LAN IP (e.g. `192.168.1.10`)
   - **Port** — `3306` (default)
   - **Database** — `tcrms` (default)
   - **Username** / **Password** — `tcrms_user` / `tcrms_password` (defaults)
4. Click **Connect to Database**, then log in with credentials from the admin

> The Database Setup screen appears once per laptop. The app saves the connection
> locally (in the app's `config.json`). Use **Change** on the login screen to reconfigure.

---

## Daily Operations (Server PC)

| Task | Action |
|------|--------|
| Start MySQL | Runs as the **MySQL80** Windows service (auto-starts on boot) |
| Backup database | `mysqldump -u tcrms_user -p tcrms > backup.sql` |
| Restore database | `mysql -u tcrms_user -p tcrms < backup.sql` |

There is no application server to start or stop — only MySQL runs on the server PC.

---

## Default Login

On the very first connection to an empty database:

- Username: `admin`
- Password: `admin123`

Change immediately after first login.

---

## Building the Client Installer (Windows)

On a Windows machine with Node.js 18+:

```bash
npm run install:client
npm run dist:win
```

Output: `client/dist-electron/JAE TRMS Setup.exe`

Distribute this file to all warehouse laptops. Staff do not need Node, Python, or MySQL.

---

## Security Note

Because the app connects straight to MySQL, each laptop stores the database
credentials locally and enforces user roles in the app. On a trusted LAN this is the
accepted trade-off for dropping the API. To limit exposure, keep `tcrms_user`
privileges scoped to the `tcrms` database only (as in the `GRANT` above) and use a
strong password.

---

## Troubleshooting (Windows)

| Problem | Fix |
|---------|-----|
| "Connection refused" | Confirm MySQL is running and `bind-address = 0.0.0.0`; check the firewall rule |
| "Could not reach the database host" | Verify the server IP and that both machines are on the same LAN |
| "Access denied" | Check the MySQL username/password entered on the Database Setup screen |
| "Database not found" | Confirm the `tcrms` database exists (step 3) |
| Wrong server IP on laptop | Click **Change** on the login screen and re-enter the details |
| Port 3306 blocked | Run the firewall command above |

---

*For Mac development setup, see [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md).*
