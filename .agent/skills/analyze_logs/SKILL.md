---
name: analyze_logs
description: Retrieves and analyzes local and production logs for errors and debugging.
---

# Analyze Application Logs

This skill helps in debugging issues by retrieving logs from Firebase or the local environment.

## Workflow

### 1. Local Server Logs
- If `start_local_dev` was used, logs are output to the terminal where the command was run.
- To read a specific log file (if configured to write to file):
  - `grep -i "error" /path/to/logfile.log`

### 2. Firebase Cloud Functions Logs (Production)
- **Retrieve Logs**:
  - `firebase functions:log --only analyzeChartGemini`
  - OR `firebase functions:log --only analyzeChart`
- **Filter for Errors**:
  - `firebase functions:log --limit 50 --only analyzeChartGemini | grep "Error"`

### 3. Firebase Debug Log
- If a deployment failed or CLI issue occurred:
  - Check `firebase-debug.log` in the root or `ChordsApp` directory.
  - Command: `cat firebase-debug.log | grep -i "error" -C 5`

## Common Error Patterns
- **Quota Exceeded**: "429 Too Many Requests" (Gemini/Claude API limits).
- **Auth Error**: "401 Unauthorized" (Firebase Token check failed).
- **Cold Start**: High latency on first request.
