# JAE TRMS — Release & Update Guide

This guide explains how to publish a new version of the app so users can receive it through the built-in auto-updater.

---

## Prerequisites

- Node.js installed
- Access to the GitHub repository (`JAE-Philippines/JAE-TCRMS`)
- A GitHub Personal Access Token with `repo` scope
  - Create one at: https://github.com/settings/tokens
  - If the repo is under an organization, enable SSO for the token after creating it

---

## How the Auto-Updater Works

1. The app is built and published to **GitHub Releases**
2. Each release includes the installer and a `latest.yml` manifest file
3. When a user clicks **"Check for Updates"** (in the Login screen or Sidebar), the app compares its current version against the latest release on GitHub
4. If a newer version exists, the user can download and install it without leaving the app

---

## Releasing a New Version — Step by Step

### Step 1: Bump the version number

Open `client/package.json` and update the `"version"` field:

```json
"version": "1.1.0"
```

Follow [Semantic Versioning](https://semver.org/):
- **Patch** (`1.0.0` → `1.0.1`): Bug fixes only
- **Minor** (`1.0.0` → `1.1.0`): New features, backwards compatible
- **Major** (`1.0.0` → `2.0.0`): Breaking changes

### Step 2: Set your GitHub token

In your terminal:

```bash
export GH_TOKEN=your_personal_access_token_here
```

> On Windows (Command Prompt):
> ```cmd
> set GH_TOKEN=your_personal_access_token_here
> ```
>
> On Windows (PowerShell):
> ```powershell
> $env:GH_TOKEN="your_personal_access_token_here"
> ```

### Step 3: Build and publish

Navigate to the `client/` folder and run:

```bash
# For Windows
npm run dist -- --publish always

# For macOS
npm run dist:mac -- --publish always
```

This will:
- Build the React frontend
- Package the Electron app
- Create a GitHub Release tagged with the version number (e.g. `v1.1.0`)
- Upload the installer and `latest.yml` to the release

### Step 4: Verify on GitHub

Go to the repository's **Releases** page on GitHub and confirm:
- A new release `v1.1.0` (or your version) is listed
- The release contains the installer file (`.exe` for Windows, `.dmg` for macOS) and a `latest.yml` / `latest-mac.yml` file

---

## Testing an Update End-to-End

1. Publish version `1.0.0` using the steps above and install it
2. Bump version to `1.1.0` and publish again
3. Open the installed `1.0.0` app
4. Click **"Check for Updates"** on the login screen or in the sidebar
5. The app should detect `1.1.0`, allow download, then prompt restart

---

## Important Notes

- The `GH_TOKEN` environment variable is only needed at **build/publish time** — not for end users
- Users must be running a packaged (installed) build for updates to work; dev mode does not support updates
- The GitHub Release must be **public** for users to download updates without authentication, unless you configure a private update server
- Always test the update flow before distributing a new version to users

---

## File Reference

| File | Purpose |
|------|---------|
| `client/package.json` | App version and electron-builder config |
| `client/electron/main.js` | Auto-updater IPC logic |
| `client/electron/preload.js` | Exposes updater API to the renderer |
| `client/src/components/UpdateButton.jsx` | Update button UI component |
