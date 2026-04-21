const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * =====================================================================
 * DEFENSIVE CYBERSECURITY MEASURES IMPLEMENTED IN THIS SECURE BACKEND
 * =====================================================================
 */

const ADMIN_PASSWORD = "secure_password_123"; // In a real app, use bcrypt to hash passwords
let timerState = { status: 'off', time: '22:30' };
let currentSessionToken = null; 

// 1. Defense against Brute Force Attacks: RATE LIMITING & LOCKOUT
// We track failed attempts by IP. After 5 failures, the IP is locked out for 5 minutes.
const failedAttempts = new Map();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function checkRateLimit(ip) {
    const record = failedAttempts.get(ip);
    if (record) {
        if (record.lockedUntil && Date.now() < record.lockedUntil) return false; // Locked out
        if (record.lockedUntil && Date.now() > record.lockedUntil) failedAttempts.delete(ip); // Lock expired
    }
    return true;
}

function recordFailure(ip) {
    let record = failedAttempts.get(ip) || { count: 0, lockedUntil: null };
    record.count++;
    if (record.count >= MAX_FAILURES) record.lockedUntil = Date.now() + LOCKOUT_MS;
    failedAttempts.set(ip, record);
}

// 2. Defense against Injection Attacks: STRICT INPUT VALIDATION (Allowlisting)
// We never trust user input. We strictly validate the format before processing it.
function validateInput(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Status must strictly be one of these exact strings
    if (!['active', 'off'].includes(data.status)) return false;
    
    // Time must strictly match HH:MM 24-hour format
    if (typeof data.time !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.time)) return false;
    
    return true;
}

// 3. Defense against Directory Traversal (LFI): PATH SANITIZATION
// Ensures users cannot request sensitive files like "../../etc/passwd"
function getSecureFilePath(requestUrl) {
    const parsedUrl = new URL(requestUrl, `http://localhost`);
    const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(__dirname, sanitizePath);
    
    if (filePath === __dirname || filePath === path.join(__dirname, '/')) {
        filePath = path.join(__dirname, 'index.html');
    }
    return filePath;
}

const server = http.createServer((req, res) => {
    const ip = req.socket.remoteAddress;

    const sendJson = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    const parseBody = (callback) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try { callback(JSON.parse(body)); } 
            catch (e) { sendJson(400, { error: "Malformed JSON Payload" }); }
        });
    };

    // --- SECURE API ROUTES ---

    if (req.method === 'POST' && req.url === '/api/login') {
        if (!checkRateLimit(ip)) {
            return sendJson(429, { error: "Security Alert: Too many failed attempts. Try again in 5 minutes." });
        }

        parseBody(body => {
            if (body.password === ADMIN_PASSWORD) {
                failedAttempts.delete(ip); // Reset on success
                // In production, use a secure cryptographic library to generate JWTs
                currentSessionToken = "secure_token_" + Math.random().toString(36).substr(2); 
                sendJson(200, { success: true, token: currentSessionToken });
            } else {
                recordFailure(ip);
                sendJson(401, { error: "Invalid password" });
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/api/get-timer') {
        return sendJson(200, timerState);
    }

    if (req.method === 'POST' && req.url === '/api/set-timer') {
        // Enforce Session Authentication
        const token = req.headers['authorization'];
        if (!token || token !== currentSessionToken) {
            return sendJson(401, { error: "Unauthorized request" });
        }

        parseBody(body => {
            // Enforce Input Sanitization
            if (!validateInput(body)) {
                return sendJson(400, { error: "Security Alert: Invalid input detected" });
            }
            timerState = { status: body.status, time: body.time };
            sendJson(200, { success: true, state: timerState });
        });
        return;
    }

    // --- SECURE FILE SERVING ---
    const filePath = getSecureFilePath(req.url);
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.png': contentType = 'image/png'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404); res.end("404 Not Found");
            } else {
                res.writeHead(500); res.end("Server Error");
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🛡️ Secure Backend Server Running!`);
    console.log(`- Accessible locally at: http://localhost:${PORT}`);
    console.log(`- Active security: Rate Limiting, Strict Input Validation, Path Sanitization`);
});
