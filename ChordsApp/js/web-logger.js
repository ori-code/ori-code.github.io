/**
 * Web Logger - Captures browser console logs and sends to server
 * Include this script in index.html to enable remote logging
 *
 * Logs are saved to: ChordsApp/web-debug.log
 * View logs: GET /api/logs?adminKey=YOUR_KEY&lines=100
 * Clear logs: DELETE /api/logs?adminKey=YOUR_KEY
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Only send logs when running on localhost (development)
        enabledHosts: ['localhost', '127.0.0.1'],
        serverUrl: 'http://localhost:3002/api/log',
        batchInterval: 2000, // Send logs every 2 seconds
        maxBatchSize: 50,    // Max logs per batch
        logLevels: ['log', 'warn', 'error', 'info', 'debug']
    };

    // Check if logging should be enabled
    const isEnabled = CONFIG.enabledHosts.some(host =>
        window.location.hostname.includes(host)
    );

    if (!isEnabled) {
        console.log('[WebLogger] Disabled - not on localhost');
        return;
    }

    // Store original console methods
    const originalConsole = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console),
        debug: console.debug.bind(console)
    };

    // Log queue for batching
    let logQueue = [];
    let isSending = false;

    // Format any value for logging
    function formatValue(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (value instanceof Error) {
            return {
                name: value.name,
                message: value.message,
                stack: value.stack
            };
        }
        if (typeof value === 'object') {
            try {
                return JSON.parse(JSON.stringify(value));
            } catch (e) {
                return String(value);
            }
        }
        return value;
    }

    // Create log entry
    function createLogEntry(level, args) {
        const formatted = Array.from(args).map(formatValue);
        const message = formatted.map(v =>
            typeof v === 'object' ? JSON.stringify(v) : String(v)
        ).join(' ');

        return {
            level: level,
            message: message,
            data: formatted.length > 1 ? formatted : (formatted[0] || null),
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
    }

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
                // Silently fail - don't spam console with fetch errors
            }
        }

        isSending = false;
    }

    // Override console methods
    CONFIG.logLevels.forEach(level => {
        console[level] = function(...args) {
            // Call original console method
            originalConsole[level](...args);

            // Skip logging our own internal messages
            const firstArg = args[0];
            if (typeof firstArg === 'string' && firstArg.startsWith('[WebLogger]')) {
                return;
            }

            // Add to queue
            logQueue.push(createLogEntry(level, args));
        };
    });

    // Capture unhandled errors
    window.addEventListener('error', function(event) {
        logQueue.push(createLogEntry('error', [{
            type: 'uncaughtError',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? {
                name: event.error.name,
                message: event.error.message,
                stack: event.error.stack
            } : null
        }]));
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        logQueue.push(createLogEntry('error', [{
            type: 'unhandledRejection',
            reason: formatValue(event.reason)
        }]));
    });

    // Start batch sending
    setInterval(sendLogs, CONFIG.batchInterval);

    // Send remaining logs before page unload
    window.addEventListener('beforeunload', function() {
        if (logQueue.length > 0) {
            // Use sendBeacon for reliability
            const logs = logQueue.splice(0);
            logs.forEach(log => {
                navigator.sendBeacon(CONFIG.serverUrl, JSON.stringify(log));
            });
        }
    });

    // Expose manual logging function
    window.webLog = function(message, data) {
        logQueue.push(createLogEntry('log', [{ webLog: true, message, data }]));
    };

    originalConsole.log('[WebLogger] Enabled - logs will be sent to server');
})();
