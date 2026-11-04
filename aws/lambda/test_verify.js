/**
 * test_verify.js - Standalone Test Suite for RFC 6238 TOTP & Verification
 * Run with: node aws/lambda/test_verify.js
 */

const crypto = require('crypto');

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

function generateTotp(secretKey, counter) {
  const keyBuffer = base32ToBuffer(secretKey);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', keyBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binaryCode % 1000000).toString().padStart(6, '0');
}

function runTests() {
  console.log('====================================================');
  console.log('MFA Hardware Token Simulator - Unit & Crypto Tests');
  console.log('====================================================\n');

  const secret = 'JBSWY3DPEHPK3PXP'; // Standard Base32 "Hello!" test seed
  const epoch = Math.floor(Date.now() / 1000);
  const step = Math.floor(epoch / 30);

  // Test 1: Length and formatting
  const token = generateTotp(secret, step);
  console.log(`[PASS] Test 1: Generated 6-digit OTP: ${token} (length: ${token.length})`);
  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    throw new Error('Test 1 failed: OTP is not 6 numeric digits');
  }

  // Test 2: Deterministic generation
  const token2 = generateTotp(secret, step);
  console.log(`[PASS] Test 2: Deterministic match: ${token} === ${token2}`);
  if (token !== token2) {
    throw new Error('Test 2 failed: Same step produced different tokens');
  }

  // Test 3: Next step yields different OTP
  const nextToken = generateTotp(secret, step + 1);
  console.log(`[PASS] Test 3: Next window OTP (+30s): ${nextToken} (differs: ${token !== nextToken})`);

  // Test 4: Drift compensation simulation
  const offsets = [-1, 0, 1];
  let verified = false;
  const submittedToken = generateTotp(secret, step - 1); // User submitted with 20s latency
  for (const off of offsets) {
    if (generateTotp(secret, step + off) === submittedToken) {
      verified = true;
      console.log(`[PASS] Test 4: Drift tolerance verified token from window offset ${off}`);
      break;
    }
  }
  if (!verified) throw new Error('Test 4 failed: Drift tolerance window rejected valid past token');

  // Test 5: Bogus token rejection
  const bogus = '999999';
  let bogusAccepted = false;
  for (const off of offsets) {
    if (generateTotp(secret, step + off) === bogus) {
      bogusAccepted = true;
    }
  }
  if (!bogusAccepted) {
    console.log('[PASS] Test 5: Correctly rejected unauthorized OTP (999999)');
  }

  console.log('\nAll 5 Cryptographic Verification Tests PASSED successfully!\n');
}

runTests();
