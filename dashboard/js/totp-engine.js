/**
 * totp-engine.js - RFC 6238 TOTP (Time-Based One-Time Password) Cryptographic Engine
 * Browser implementation using Web Crypto API (SubtleCrypto)
 * Author: Purna Chandar Reddy
 */

class TotpEngine {
  constructor(secret = 'JBSWY3DPEHPK3PXP', timeStep = 30, digits = 6) {
    this.secret = secret;
    this.timeStep = timeStep;
    this.digits = digits;
  }

  setSecret(newSecret) {
    this.secret = newSecret.replace(/\s+/g, '').toUpperCase();
  }

  // Base32 Decoder (RFC 4648)
  base32ToUint8Array(base32) {
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
    return new Uint8Array(bytes);
  }

  // Calculate current time step
  getCurrentStep(epochSec = null) {
    const epoch = epochSec !== null ? epochSec : Math.floor(Date.now() / 1000);
    return Math.floor(epoch / this.timeStep);
  }

  // Calculate remaining seconds in current time window
  getRemainingSeconds(epochSec = null) {
    const epoch = epochSec !== null ? epochSec : Math.floor(Date.now() / 1000);
    return this.timeStep - (epoch % this.timeStep);
  }

  // Generate 6-digit TOTP asynchronously using Web Crypto API
  async generateToken(step = null) {
    const currentStep = step !== null ? step : this.getCurrentStep();
    const keyBytes = this.base32ToUint8Array(this.secret);

    // Pack 64-bit integer into 8 bytes (Big-Endian)
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(currentStep), false);

    // Import secret key for HMAC-SHA1
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    // Calculate HMAC
    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const hashBytes = new Uint8Array(signature);

    // Dynamic Truncation (RFC 4226 / 6238)
    const offset = hashBytes[hashBytes.length - 1] & 0x0f;
    const binary =
      ((hashBytes[offset] & 0x7f) << 24) |
      ((hashBytes[offset + 1] & 0xff) << 16) |
      ((hashBytes[offset + 2] & 0xff) << 8) |
      (hashBytes[offset + 3] & 0xff);

    const otpVal = binary % Math.pow(10, this.digits);
    const token = otpVal.toString().padStart(this.digits, '0');

    // Convert full hash to hex for inspection view
    const hashHex = Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

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
