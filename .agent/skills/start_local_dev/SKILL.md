---
name: start_local_dev
description: Starts the local development environment for ChordsApp, including the backend server and frontend serving.
---

# Start Local Development Environment

This skill automates the startup of the local Express server and provides instructions for the frontend.

## Workflow

1.  **Check Port Availability**
    - Ensure port 3002 (backend) is free.
    - If occupied, identify process: `lsof -i :3002` (macOS).

2.  **Start Backend Server**
    - Navigate: `cd /Volumes/1TB_EXFAT/Development\ www.TheFaithSound.com/ori-code.github.io/ChordsApp`
    - Start Server: `npm run dev` (uses nodemon) OR `node server.js`
    - **Note**: The server runs at `http://localhost:3002`.

3.  **Frontend Instructions**
    - Since this is a static site (GitHub Pages structure), you can simply open `index.html` in a browser.
    - OR use a simple http server: `npx http-server . -p 8080`
    - Note: Ensure `app.js` is pointing to the local backend if testing local changes (`http://localhost:3002/api/analyze-chart`).

4.  **Verification**
    - Health check: `curl http://localhost:3002/health`
    - Expected output: `{"status":"ok","message":"aChordimClaude API is running"}`
