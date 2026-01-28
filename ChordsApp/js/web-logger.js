/**
 * Web Logger - Sends explicit logs to server for debugging
 *
 * USAGE:
 *   webLog('message');                    // Simple log
 *   webLog('message', { data: 123 });     // Log with data
 *   webLog.error('error message');        // Error log
 *   webLog.warn('warning');               // Warning log
 *
 * Logs are saved to: ChordsApp/web-debug.log (localhost only)
 * View logs: GET /api/logs?adminKey=YOUR_KEY&lines=100
 * Clear logs: DELETE /api/logs?adminKey=YOUR_KEY
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enabledHosts: ['localhost', '127.0.0.1'],
        serverUrl: 'http://localhost:3002/api/log',
        batchInterval: 1000,
        maxBatchSize: 50
    };

    // Check if logging should be enabled
    const isEnabled = CONFIG.enabledHosts.some(host =>
        window.location.hostname.includes(host)
    );

    // Log queue for batching
    let logQueue = [];
    let isSending = false;

    // Send logs to server
    async function sendLogs() {
        if (isSending || logQueue.length === 0) return;

        isSending = true;
        const logsToSend = logQueue.splice(0, CONFIG.maxBatchSize);

        for (const log of logsToSend) {
            try {
                await fetch(CONFIG.serverUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(log)
                });
            } catch (e) {
                // Silently fail
            }
        }

        isSending = false;
    }

    // Create log entry
    function createLogEntry(level, message, data) {
        return {
            level: level,
            message: String(message),
            data: data || null,
            timestamp: new Date().toISOString(),
            url: window.location.pathname,
            userAgent: navigator.userAgent.substring(0, 50)
        };
    }

    // Main logging function
    function webLog(message, data) {
        if (!isEnabled) return;
        console.log('[webLog]', message, data || '');
        logQueue.push(createLogEntry('log', message, data));
    }

    // Log levels
    webLog.log = function(message, data) {
        if (!isEnabled) return;
        console.log('[webLog]', message, data || '');
        logQueue.push(createLogEntry('log', message, data));
    };

    webLog.info = function(message, data) {
        if (!isEnabled) return;
        console.info('[webLog]', message, data || '');
        logQueue.push(createLogEntry('info', message, data));
    };

    webLog.warn = function(message, data) {
        if (!isEnabled) return;
        console.warn('[webLog]', message, data || '');
        logQueue.push(createLogEntry('warn', message, data));
    };

    webLog.error = function(message, data) {
        if (!isEnabled) return;
        console.error('[webLog]', message, data || '');
        logQueue.push(createLogEntry('error', message, data));
    };

    // Capture unhandled errors (always useful)
    window.addEventListener('error', function(event) {
        if (!isEnabled) return;
        logQueue.push(createLogEntry('error', 'Uncaught: ' + event.message, {
            filename: event.filename,
            line: event.lineno,
            col: event.colno
        }));
    });

    window.addEventListener('unhandledrejection', function(event) {
        if (!isEnabled) return;
        logQueue.push(createLogEntry('error', 'Unhandled Promise: ' + String(event.reason)));
    });

    // Start batch sending
    if (isEnabled) {
        setInterval(sendLogs, CONFIG.batchInterval);

        // Send remaining logs before page unload
        window.addEventListener('beforeunload', function() {
            if (logQueue.length > 0) {
                logQueue.forEach(log => {
                    navigator.sendBeacon(CONFIG.serverUrl, JSON.stringify(log));
                });
            }
        });

        console.log('[WebLogger] Ready - use webLog() to send logs to server');
    }

    // Expose to global
    window.webLog = webLog;
})();
