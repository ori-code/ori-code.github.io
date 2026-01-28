---
name: verify_and_deploy_functions
description: Safely verifies and deploys Firebase Cloud Functions to the production environment.
---

# Verify and Deploy Cloud Functions

This skill guides the agent through safely deploying the `functions/` directory to Firebase.

## Prerequisites
- `firebase-tools` must be installed (`npm install -g firebase-tools`).
- User must be logged in (`firebase login` or `GOOGLE_APPLICATION_CREDENTIALS`).

## Workflow

1.  **Navigate to Functions Directory**
    - `cd /Volumes/1TB_EXFAT/Development\ www.TheFaithSound.com/ori-code.github.io/ChordsApp/functions`

2.  **Verify Code Integrity**
    - Run linting (if configured): `npm run lint` -- IF it fails, STOP and fix errors.
    - Check for syntax errors: `node -c index.js`

3.  **Confirm Project Connection**
    - Check active project: `firebase use`
    - Ensure it points to `chordsapp-e10e7` (based on `firebase-config.js` and `server.js` findings).

4.  **Deploy Functions**
    - Execute: `firebase deploy --only functions`
    - **Monitor Output**: Watch for any deployment errors.

5.  **Post-Deployment Verification**
    - Check the output for the Function URL.
    - Log the URL for the user.
