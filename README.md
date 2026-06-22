# JAE TCRMS — Training and Certification Record Management System

**JAE Philippines, Inc. — Internal Warehouse Application**

A production desktop application for managing employee training and certification records. Runs completely **offline** on the company's local area network (LAN). No internet connection required.

---

## How to Run

### Running the Server

The server must be running on one dedicated machine before any client can connect.

**Step 1 — Install Node.js** (one-time, server machine only)

Download and install Node.js from [https://nodejs.org](https://nodejs.org). Version 18 or newer is required.

**Step 2 — Install server dependencies** (one-time)

Open Command Prompt, navigate to the `server/` folder, and run:

```
cd server
npm install
```

**Step 3 — Start the server**

Double-click `server/start-server.bat`

Or from Command Prompt:

```
cd server
node src/index.js
```

The console will show:
```
JAE-TCRMS Server running on port 3000
```
It will also display the machine's IP address (e.g., `192.168.1.10`). Note this IP — all client machines need it.

**Step 4 — Allow the port through Windows Firewall** (one-time, if blocked)

Run this in Command Prompt as Administrator:

```
netsh advfirewall firewall add rule name="JAE TCRMS Server" dir=in action=allow protocol=TCP localport=3000
```

---

### Running the Desktop Client

**Step 1 — Install the app**

Run the `JAE TCRMS Setup.exe` installer on each warehouse PC.

**Step 2 — First launch: enter the server IP**

When the app opens for the first time, a setup screen will appear. Enter the server machine's IP address (e.g., `192.168.1.10`) and port `3000`, then click **Connect to Server**.

**Step 3 — Log in**

Use the default admin account on first login:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Administrator |

> **Important:** Go to User Management immediately after first login and change the admin password. Then create accounts for your encoders and viewers.

---

### Auto-Start the Server on Windows Boot (Recommended)

So the server starts automatically whenever the server machine is turned on:

1. Right-click `start-server.bat` → **Create shortcut**
2. Press `Win + R`, type `shell:startup`, press Enter
3. Move the shortcut into the Startup folder that opens

---

## Running in Development Mode

Use this if you are a developer setting up or testing the application on your own machine.

**Prerequisites:** Node.js 18+, Git

**Step 1 — Install all dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

**Step 2 — Start the server** (Terminal 1)

```bash
cd server
node src/index.js
```

Or from the root folder:

```bash
npm run server
```

**Step 3 — Start the Electron client in dev mode** (Terminal 2)

```bash
cd client
npm run dev
```

Or from the root folder:

```bash
npm run dev
```

This opens the Electron window connected to the local server at `http://localhost:3000`.

---

## Building the Windows Installer

Run this to produce `client/dist-electron/JAE TCRMS Setup.exe`:

```bash
cd client
npm run dist
```

Requirements: Node.js 18+, Windows machine (or Wine on macOS/Linux).

---

## User Roles

| Role | What They Can Do |
|------|-----------------|
| **Admin** | Full access — manage users, employees, training records, and reports |
| **Encoder** | Add and edit employees and training records |
| **Viewer** | Read-only public directory (no login required) |

Only the `admin` account is created automatically on first run. The admin must create additional Encoder and Viewer accounts from the User Management page.

---

## Architecture

```
Company LAN (192.168.x.x)
│
├── SERVER MACHINE (1 dedicated PC)
│   ├── Node.js + Express REST API  →  port 3000
│   └── SQLite Database  →  server/data/tcrms.db
│
├── WAREHOUSE PC 1  →  Electron Desktop App
├── WAREHOUSE PC 2  →  Electron Desktop App
└── WAREHOUSE PC N  →  Electron Desktop App
```

All client machines connect to the server over HTTP on the local network. No data leaves the building.

---

## File Structure

```
JAE-TCRMS/
├── server/                    ← Copy this to the server machine
│   ├── src/
│   │   ├── index.js           ← Server entry point
│   │   ├── db.js              ← Database schema and initialization
│   │   ├── middleware/
│   │   │   └── auth.js        ← JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.js        ← Login / logout
│   │       ├── employees.js   ← Employee CRUD
│   │       ├── trainings.js   ← Training records CRUD
│   │       ├── users.js       ← User management (admin only)
│   │       └── reports.js     ← Reports and CSV export
│   ├── data/
│   │   └── tcrms.db           ← SQLite database (created automatically)
│   ├── start-server.bat       ← Double-click to start the server
│   └── package.json
│
├── client/                    ← Electron desktop application
│   ├── electron/
│   │   ├── main.js            ← Electron main process
│   │   └── preload.js         ← Secure IPC bridge
│   ├── src/
│   │   ├── App.jsx            ← App router and role guards
│   │   ├── api/index.js       ← API client (Axios)
│   │   ├── context/           ← Auth context and state
│   │   ├── pages/             ← All application pages
│   │   └── components/        ← Shared UI components
│   └── package.json
│
└── README.md
```

---

## Database Backup

The entire database is a single file:

```
server/data/tcrms.db
```

To back up all data, copy this file to a USB drive or network share. It is recommended to do this at the end of every shift.

To restore, stop the server, replace `tcrms.db` with the backup copy, then restart the server.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to server" | Check that the server machine is on and `start-server.bat` is running |
| "Invalid username or password" | Check caps lock; ask the admin to reset your password |
| Client shows blank / loading screen | Restart the app; verify the server IP in the settings screen |
| Port 3000 blocked | Run the firewall command above on the server machine |
| Forgot admin password | Stop the server, delete `server/data/tcrms.db`, restart — this resets all data |
| Database corrupted | Stop the server, restore `tcrms.db` from backup, restart |

---

## Security Notes

- All passwords are stored as bcrypt hashes — never in plain text
- JWT login sessions expire after 8 hours
- Every data change is recorded in the audit log
- The server only listens on the local network — no external access
- No internet connection is used at any point

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron |
| Frontend | React 18 + Tailwind CSS |
| Build tool | Vite |
| Backend | Node.js + Express 4 |
| Database | SQLite via better-sqlite3 |
| Authentication | JWT + bcrypt |
| Packaging | electron-builder (NSIS installer) |

---

*JAE Philippines, Inc. — For internal use only. Version 1.0.0*
