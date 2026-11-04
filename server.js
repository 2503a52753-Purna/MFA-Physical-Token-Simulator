/**
 * server.js - Development Server & Local AWS Lambda Verification API Mock
 * Allows testing the dashboard locally without requiring active AWS credentials.
 * Author: Purna Chandar Reddy
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DEFAULT_SECRET = process.env.DEFAULT_SHARED_SECRET || 'JBSWY3DPEHPK3PXP';
const consumedSteps = new Set();

// Base32 Decoder
function base32ToBuffer(b32) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let cleaned = b32.replace(/=+$/, '').toUpperCase(), bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = alpha.indexOf(cleaned[i]);
    if (val !== -1) bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

// Generate RFC 6238 TOTP
function generateTotp(secret, counter) {
  const keyBuf = base32ToBuffer(secret);
  const cntBuf = Buffer.alloc(8);
  cntBuf.writeBigUInt64BE(BigInt(counter), 0);
  const hmac = crypto.createHmac('sha1', keyBuf).update(cntBuf).digest();
  const off = hmac[hmac.length - 1] & 0x0f;
  const bin = ((hmac[off] & 0x7f) << 24) | ((hmac[off+1] & 0xff) << 16) | ((hmac[off+2] & 0xff) << 8) | (hmac[off+3] & 0xff);
  return (bin % 1000000).toString().padStart(6, '0');
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle Mock AWS Lambda API Route: POST /api/verify
  if (req.method === 'POST' && (req.url === '/api/verify' || req.url === '/verify')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const startTime = Date.now();
      try {
        const payload = JSON.parse(body || '{}');
        const { deviceId = 'ESP32-MFA-01', otp = '', userId = 'admin@cloudenterprise.io' } = payload;
        const cleanOtp = String(otp).trim();

        if (cleanOtp.length !== 6) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid 6-digit OTP' }));
          return;
        }

        const epoch = Math.floor(Date.now() / 1000);
        const currentStep = Math.floor(epoch / 30);
        let isValid = false;
        let matchedStep = null;

        for (let off = -1; off <= 1; off++) {
          const step = currentStep + off;
          if (generateTotp(DEFAULT_SECRET, step) === cleanOtp) {
            if (consumedSteps.has(step)) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                verified: false,
                error: 'REPLAY_ATTACK_DETECTED',
                message: 'This OTP was already consumed! Replay attack prevented.'
              }));
              return;
            }
            isValid = true;
            matchedStep = step;
            break;
          }
        }

        const latency = Date.now() - startTime + 38; // Simulate cloud latency

        if (isValid) {
          consumedSteps.add(matchedStep);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            verified: true,
            deviceId,
            userId,
            sessionToken: 'mfa_sess_' + crypto.randomBytes(16).toString('hex'),
            matchedStep,
            latencyMs: latency,
            expiresIn: 300,
            message: 'Token verified by AWS Lambda Mock.'
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            verified: false,
            error: 'INVALID_OR_EXPIRED_TOKEN',
            latencyMs: latency
          }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static File Serving from dashboard/ directory
  let filePath = path.join(__dirname, 'dashboard', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('================================================================');
  console.log(` MFA Physical Token Simulator - Local Dashboard & Lambda Mock `);
  console.log(` Running at: http://localhost:${PORT}`);
  console.log(` Lambda Mock Endpoint: http://localhost:${PORT}/api/verify`);
  console.log('================================================================');
});
