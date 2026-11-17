/**
 * AWS Lambda Function: Verify MFA Physical Token OTP
 * Runtime: Node.js 20.x / 22.x / 24.x / 26.x (ES Module)
 * Project: MFA Physical Token Simulator (Cloud Computing Product #2)
 * Author: Purna Chandar Reddy
 */

import crypto from 'crypto';

const DEFAULT_SECRET = process.env.DEFAULT_SHARED_SECRET || 'JBSWY3DPEHPK3PXP';
const TIME_STEP = 30; // 30-second window
const usedSteps = new Set(); // In-memory Replay Attack protection

// Base32 Decoding to Buffer (RFC 4648)
function base32ToBuffer(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let cleaned = base32.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

// Compute RFC 6238 TOTP given secret key and counter
function generateTotp(secretKey, counter) {
  const keyBuffer = base32ToBuffer(secretKey);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', keyBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic Truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (binaryCode % 1000000).toString().padStart(6, '0');
  return otp;
}

// Main Verification Handler
export const handler = async (event) => {
  const startTime = Date.now();
  console.log('[MFA-LAMBDA] Received event:', JSON.stringify(event));

  const httpMethod = (event.requestContext?.http?.method || event.httpMethod || '').toUpperCase();
  if (httpMethod === 'OPTIONS') {
    return buildResponse(204, '');
  }

  // Parse HTTP body from Lambda Function URL or API Gateway
  let body = {};
  if (event.body) {
    try {
      let raw = event.body;
      if (event.isBase64Encoded) {
        raw = Buffer.from(event.body, 'base64').toString('utf8');
      }
      body = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
      return buildResponse(400, {
        success: false,
        error: 'Invalid JSON request body'
      });
    }
  } else {
    body = event;
  }

  // Health-check / ping probe support
  if (httpMethod === 'GET' || body.action === 'ping' || body.test === true) {
    return buildResponse(200, {
      status: 'ONLINE',
      connected: true,
      service: 'AWS Lambda MFA Verification Engine',
      region: process.env.AWS_REGION || 'us-east-1',
      timestamp: Math.floor(Date.now() / 1000),
      message: 'AWS Lambda verification engine is online and operational.'
    });
  }

  const { deviceId = 'ESP32-MFA-01', otp, userId = 'admin@cloudenterprise.io' } = body;

  if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
    return buildResponse(400, {
      success: false,
      error: 'Invalid OTP format. Must be a 6-digit string.'
    });
  }

  const cleanOtp = otp.trim();
  const currentEpoch = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(currentEpoch / TIME_STEP);
  const deviceSecret = DEFAULT_SECRET;

  // Validate against time window [-1, 0, +1] or synchronized client step
  let isValid = false;
  let matchedStep = null;

  const testSteps = [currentStep, currentStep - 1, currentStep + 1];
  if (typeof body.step === 'number' && Math.abs(body.step - currentStep) <= 50) {
    if (!testSteps.includes(body.step)) testSteps.push(body.step);
  }

  for (const testStep of testSteps) {
    const expectedOtp = generateTotp(deviceSecret, testStep);

    if (expectedOtp === cleanOtp) {
      // Replay Attack Detection
      if (usedSteps.has(testStep)) {
        console.warn(`[REPLAY-ATTACK] Token ${cleanOtp} matches step ${testStep} which was already used.`);
        return buildResponse(403, {
          success: false,
          verified: false,
          error: 'REPLAY_ATTACK_DETECTED',
          message: 'This OTP was already consumed. Please wait for the hardware token to generate a new code.'
        });
      }
      isValid = true;
      matchedStep = testStep;
      break;
    }
  }

  const executionLatencyMs = Date.now() - startTime;

  if (isValid) {
    usedSteps.add(matchedStep);
    console.log(`[AUTH-SUCCESS] Device: ${deviceId} | User: ${userId} | Step: ${matchedStep} | Latency: ${executionLatencyMs}ms`);

    const sessionToken = 'mfa_sess_' + crypto.randomBytes(16).toString('hex');

    return buildResponse(200, {
      success: true,
      verified: true,
      deviceId,
      userId,
      sessionToken,
      expiresIn: 300,
      timestamp: currentEpoch,
      latencyMs: executionLatencyMs,
      message: 'MFA Hardware Token verified successfully by AWS Lambda.'
    });
  } else {
    console.warn(`[AUTH-FAILED] Device: ${deviceId} | Code: ${cleanOtp} | Expected for step ${currentStep}: ${generateTotp(deviceSecret, currentStep)}`);
    return buildResponse(401, {
      success: false,
      verified: false,
      error: 'INVALID_OR_EXPIRED_TOKEN',
      message: 'The OTP entered does not match the token synchronized with AWS Lambda.',
      timestamp: currentEpoch,
      latencyMs: executionLatencyMs
    });
  }
};

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    },
    body: JSON.stringify(body)
  };
}
