/**
 * totp-engine.js - RFC 6238 TOTP (Time-Based One-Time Password) Cryptographic Engine
 * Includes dual-engine implementation:
 * 1. Web Crypto API (SubtleCrypto) for ultra-fast native crypto
 * 2. Pure JavaScript HMAC-SHA1 fallback for 100% universal compatibility across all browsers/contexts
 * Author: Purna Chandar Reddy
 */

class TotpEngine {
  constructor(secret = 'JBSWY3DPEHPK3PXP', timeStep = 30, digits = 6) {
    this.secret = secret.replace(/\s+/g, '').toUpperCase();
    this.timeStep = timeStep;
    this.digits = digits;
    this.manualStepOffset = 0;
    this.windowStartTime = Date.now();
    this.lastGeneratedStep = 0;
    this.lastGeneratedToken = '';
  }

  setSecret(newSecret) {
    this.secret = (newSecret || 'JBSWY3DPEHPK3PXP').replace(/\s+/g, '').toUpperCase();
  }

  // Advance to next fresh step (used on manual button press)
  advanceStep() {
    this.manualStepOffset++;
    this.windowStartTime = Date.now();
    return this.getCurrentStep();
  }

  // Reset the 30-second timer window
  resetWindow() {
    this.windowStartTime = Date.now();
  }

  // Base32 Decoder (RFC 4648)
  base32ToUint8Array(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let cleaned = (base32 || '').replace(/=+$/, '').toUpperCase();
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
    return new Uint8Array(bytes);
  }

  // Calculate current time step (includes manual step offset if triggered)
  getCurrentStep(epochSec = null) {
    const epoch = epochSec !== null ? epochSec : Math.floor(Date.now() / 1000);
    return Math.floor(epoch / this.timeStep) + this.manualStepOffset;
  }

  // Calculate remaining seconds in current time window
  getRemainingSeconds() {
    if (this.windowStartTime) {
      const elapsed = Math.floor((Date.now() - this.windowStartTime) / 1000);
      const remaining = this.timeStep - (elapsed % this.timeStep);
      return Math.max(1, Math.min(30, remaining));
    }
    const epoch = Math.floor(Date.now() / 1000);
    return this.timeStep - (epoch % this.timeStep);
  }

  // Pure JavaScript SHA-1 implementation (RFC 3174 compliant)
  static sha1(buffer) {
    let H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0;
    const l = buffer.length;
    const wordCount = (((l + 8) >> 6) + 1) * 16;
    const words = new Uint32Array(wordCount);
    for (let i = 0; i < l; i++) words[i >> 2] |= buffer[i] << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    words[wordCount - 1] = l * 8;

    const W = new Uint32Array(80);
    for (let i = 0; i < wordCount; i += 16) {
      for (let t = 0; t < 16; t++) W[t] = words[i + t];
      for (let t = 16; t < 80; t++) {
        const v = W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16];
        W[t] = (v << 1) | (v >>> 31);
      }
      let a = H0, b = H1, c = H2, d = H3, e = H4;
      for (let t = 0; t < 80; t++) {
        let f, k;
        if (t < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
        else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        const temp = (((a << 5) | (a >>> 27)) + f + e + k + W[t]) | 0;
        e = d; d = c; c = ((b << 30) | (b >>> 2)) | 0; b = a; a = temp;
      }
      H0 = (H0 + a) | 0; H1 = (H1 + b) | 0; H2 = (H2 + c) | 0; H3 = (H3 + d) | 0; H4 = (H4 + e) | 0;
    }

    const res = new Uint8Array(20);
    const dv = new DataView(res.buffer);
    dv.setUint32(0, H0); dv.setUint32(4, H1); dv.setUint32(8, H2); dv.setUint32(12, H3); dv.setUint32(16, H4);
    return res;
  }

  // Pure JavaScript HMAC-SHA1 implementation (RFC 2104 compliant)
  static hmacSha1(keyBytes, msgBytes) {
    let k = new Uint8Array(keyBytes);
    if (k.length > 64) k = TotpEngine.sha1(k);
    const kPad = new Uint8Array(64);
    kPad.set(k);

    const ipad = new Uint8Array(64 + msgBytes.length);
    const opad = new Uint8Array(64 + 20);
    for (let i = 0; i < 64; i++) {
      ipad[i] = kPad[i] ^ 0x36;
      opad[i] = kPad[i] ^ 0x5c;
    }
    ipad.set(msgBytes, 64);
    const inner = TotpEngine.sha1(ipad);
    opad.set(inner, 64);
    return TotpEngine.sha1(opad);
  }

  // Generate 6-digit TOTP (tries Web Crypto API first, falls back to pure JS)
  async generateToken(step = null) {
    const currentStep = step !== null ? step : this.getCurrentStep();
    const keyBytes = this.base32ToUint8Array(this.secret);

    // Pack 64-bit integer into 8 bytes (Big-Endian)
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(currentStep), false);
    const timeBytes = new Uint8Array(timeBuffer);

    let hashBytes;

    // Try Web Crypto API if available
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.importKey) {
      try {
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          keyBytes,
          { name: 'HMAC', hash: { name: 'SHA-1' } },
          false,
          ['sign']
        );
        const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
        hashBytes = new Uint8Array(signature);
      } catch (e) {
        // Fallback to pure JS
        hashBytes = TotpEngine.hmacSha1(keyBytes, timeBytes);
      }
    } else {
      // Pure JS fallback
      hashBytes = TotpEngine.hmacSha1(keyBytes, timeBytes);
    }

    // Dynamic Truncation (RFC 4226 / 6238)
    const offset = hashBytes[hashBytes.length - 1] & 0x0f;
    const binary =
      ((hashBytes[offset] & 0x7f) << 24) |
      ((hashBytes[offset + 1] & 0xff) << 16) |
      ((hashBytes[offset + 2] & 0xff) << 8) |
      (hashBytes[offset + 3] & 0xff);

    const otpVal = binary % Math.pow(10, this.digits);
    const token = otpVal.toString().padStart(this.digits, '0');

    // Convert full hash to hex
    const hashHex = Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    this.lastGeneratedStep = currentStep;
    this.lastGeneratedToken = token;

    return {
      token,
      step: currentStep,
      offset,
      binary,
      hashHex,
      secret: this.secret
    };
  }

  // Validate token against a given drift window [-drift, +drift]
  async verifyTokenLocally(inputOtp, drift = 1) {
    const cleanInput = String(inputOtp).trim();
    const currentStep = this.getCurrentStep();

    for (let offset = -drift; offset <= drift; offset++) {
      const step = currentStep + offset;
      const result = await this.generateToken(step);
      if (result.token === cleanInput) {
        return {
          valid: true,
          matchedOffset: offset,
          matchedStep: step,
          timestamp: Math.floor(Date.now() / 1000)
        };
      }
    }

    return {
      valid: false,
      currentStep,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
}

window.TotpEngine = TotpEngine;
