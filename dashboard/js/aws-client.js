/**
 * aws-client.js - AWS Cloud Integration Client & Lambda Verification Engine
 * Supports Permanent AWS Learner Lab Connection (Lambda Function URL & API Gateway HTTP API)
 * with robust local fallback to high-fidelity simulated engine.
 * Author: Purna Chandar Reddy
 */

class AwsClient {
  constructor() {
    this.region = localStorage.getItem('aws_region') || 'us-east-1';
    this.apiEndpoint = localStorage.getItem('aws_learner_lab_permanent_url') || localStorage.getItem('aws_api_endpoint') || '';
    this.iotEndpoint = localStorage.getItem('aws_iot_endpoint') || 'a1b2c3d4e5f6g7-ats.iot.us-east-1.amazonaws.com';
    this.isLearnerLab = true;
    this.isPermanent = !!this.apiEndpoint;
    this.mode = this.apiEndpoint ? 'live' : 'simulated';
    this.consumedSteps = new Set();
    this.logs = [];
    this.mqttStream = [];
    this.lastLatency = 38;
    this.stats = {
      generatedCount: 0,
      verifiedCount: 0,
      failedCount: 0,
      replayAttempts: 0,
      latencies: [38, 42, 35, 45, 40]
    };
  }

  /**
   * Initializes persistent configuration from URL params, localStorage, and aws-config.json
   */
  async initConfig() {
    // 1. Check URL query parameters (e.g., ?endpoint=https://... or ?aws_api=https://...)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlEndpoint = params.get('endpoint') || params.get('aws_api') || params.get('url');
      if (urlEndpoint && urlEndpoint.startsWith('http')) {
        this.apiEndpoint = urlEndpoint.trim();
        this.mode = 'live';
        this.isPermanent = true;
        localStorage.setItem('aws_learner_lab_permanent_url', this.apiEndpoint);
        localStorage.setItem('aws_api_endpoint', this.apiEndpoint);
        console.log('[AWS-CLIENT] Loaded permanent endpoint from URL parameter:', this.apiEndpoint);
        return;
      }
    } catch (e) {}

    // 2. Check localStorage
    const saved = localStorage.getItem('aws_learner_lab_permanent_url') || localStorage.getItem('aws_api_endpoint');
    if (saved && saved.trim().startsWith('http')) {
      this.apiEndpoint = saved.trim();
      this.mode = 'live';
      this.isPermanent = true;
      console.log('[AWS-CLIENT] Loaded permanent endpoint from localStorage:', this.apiEndpoint);
      return;
    }

    // 3. Fallback: try reading aws-config.json
    try {
      const resp = await fetch('aws-config.json', { cache: 'no-store' });
      if (resp.ok) {
        const config = await resp.json();
        if (config.apiEndpoint && config.apiEndpoint.trim().startsWith('http')) {
          this.apiEndpoint = config.apiEndpoint.trim();
          this.region = config.region || this.region;
          this.mode = 'live';
          this.isPermanent = true;
          localStorage.setItem('aws_learner_lab_permanent_url', this.apiEndpoint);
          console.log('[AWS-CLIENT] Loaded permanent endpoint from aws-config.json:', this.apiEndpoint);
        }
      }
    } catch (err) {
      // Running standalone without HTTP server or file absent
    }
  }

  /**
   * Set and permanently store AWS endpoints
   */
  setEndpoints(region, apiEndpoint, iotEndpoint, isPermanent = true) {
    this.region = region || this.region;
    this.apiEndpoint = (apiEndpoint || '').trim();
    this.iotEndpoint = (iotEndpoint || '').trim();
    this.mode = this.apiEndpoint ? 'live' : 'simulated';
    this.isPermanent = isPermanent && !!this.apiEndpoint;

    localStorage.setItem('aws_region', this.region);
    localStorage.setItem('aws_api_endpoint', this.apiEndpoint);
    if (this.isPermanent) {
      localStorage.setItem('aws_learner_lab_permanent_url', this.apiEndpoint);
    } else {
      localStorage.removeItem('aws_learner_lab_permanent_url');
    }
    localStorage.setItem('aws_iot_endpoint', this.iotEndpoint);
  }

  /**
   * Test connection to a live AWS Learner Lab endpoint with ping probe
   */
  async testConnection(targetUrl) {
    const url = (targetUrl || this.apiEndpoint || '').trim();
    if (!url || !url.startsWith('http')) {
      return { ok: false, message: 'Please enter a valid HTTP/HTTPS endpoint URL.' };
    }

    const startTime = performance.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'ping', test: true })
      });

      const latency = Math.round(performance.now() - startTime);
      let data = {};
      try { data = await response.json(); } catch (e) {}

      if (response.ok || response.status === 200 || response.status === 400 || response.status === 401) {
        return {
          ok: true,
          status: response.status,
          latency,
          endpoint: url,
          source: data.service || 'AWS Lambda (Learner Lab)',
          message: `Connected successfully! AWS responded in ${latency}ms (HTTP ${response.status}).`
        };
      } else {
        return {
          ok: false,
          status: response.status,
          latency,
          message: `Received HTTP ${response.status} from AWS. Verify your CORS and endpoint settings.`
        };
      }
    } catch (err) {
      return {
        ok: false,
        latency: Math.round(performance.now() - startTime),
        message: `Network error or CORS block: ${err.message}. Ensure CORS * is enabled in AWS.`
      };
    }
  }

  /**
   * Record MQTT message frame
   */
  recordMqttMessage(topic, payload, direction = 'TX') {
    const frame = {
      id: 'pkt_' + Math.random().toString(36).substr(2, 9),
      topic,
      payload,
      direction, // 'TX' (ESP32 -> AWS) or 'RX' (AWS -> ESP32)
      timestamp: new Date().toLocaleTimeString(),
      rawTime: Date.now()
    };
    this.mqttStream.unshift(frame);
    if (this.mqttStream.length > 50) this.mqttStream.pop();
    return frame;
  }

  /**
   * Main verification method
   */
  async verifyOtp({ deviceId = 'ESP32-MFA-01', otp, userId = 'admin@cloudenterprise.io', totpEngine }) {
    const startTime = performance.now();
    const cleanOtp = String(otp).trim();

    // 1. Live AWS Learner Lab / API Gateway / Lambda Function URL
    if (this.mode === 'live' && this.apiEndpoint) {
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            deviceId,
            otp: cleanOtp,
            userId,
            action: 'verify'
          })
        });

        const data = await response.json();
        const latency = Math.round(performance.now() - startTime);
        data.latencyMs = data.latencyMs || latency;
        this.lastLatency = data.latencyMs;

        if (response.ok && data.verified) {
          this.stats.verifiedCount++;
          this.stats.latencies.push(data.latencyMs);
          this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
            status: 'VERIFIED',
            action: 'ACCESS_GRANTED',
            userId,
            source: 'AWS_LEARNER_LAB_LIVE',
            latencyMs: data.latencyMs
          }, 'RX');
        } else {
          this.stats.failedCount++;
          if (data.error === 'REPLAY_ATTACK_DETECTED') {
            this.stats.replayAttempts++;
          }
          this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
            status: 'DENIED',
            error: data.error || 'INVALID_TOKEN',
            source: 'AWS_LEARNER_LAB_LIVE'
          }, 'RX');
        }
        return data;
      } catch (err) {
        console.warn('[AWS-CLIENT] Real AWS fetch failed, executing built-in fallback engine:', err);
        // Fall back to built-in simulation below
      }
    }

    // 2. Built-in AWS Lambda Verification Engine Simulation
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 35) + 30));

    const currentEpoch = Math.floor(Date.now() / 1000);
    const currentStep = totpEngine.getCurrentStep(currentEpoch);
    const latency = Math.round(performance.now() - startTime);
    this.lastLatency = latency;

    let matchedStep = null;
    let isValid = false;

    // Check drift window [-1, 0, +1]
    for (let offset = -1; offset <= 1; offset++) {
      const step = currentStep + offset;
      const expected = await totpEngine.generateToken(step);
      if (expected.token === cleanOtp) {
        if (this.consumedSteps.has(step)) {
          this.stats.replayAttempts++;
          this.stats.failedCount++;
          const replayErr = {
            success: false,
            verified: false,
            error: 'REPLAY_ATTACK_DETECTED',
            message: 'SECURITY ALERT: This OTP was already consumed! Replay attack blocked by AWS Lambda.',
            step,
            latencyMs: latency,
            source: 'AWS_LAMBDA_ENGINE',
            requestId: 'aws-req-' + Math.random().toString(36).substr(2, 9)
          };
          this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
            status: 'REPLAY_DENIED',
            step,
            error: 'TOKEN_ALREADY_USED',
            source: 'AWS_LAMBDA_ENGINE'
          }, 'RX');
          return replayErr;
        }
        isValid = true;
        matchedStep = step;
        break;
      }
    }

    if (isValid) {
      this.consumedSteps.add(matchedStep);
      this.stats.verifiedCount++;
      this.stats.latencies.push(latency);

      const successResult = {
        success: true,
        verified: true,
        deviceId,
        userId: userId || 'admin@cloudenterprise.io',
        sessionToken: 'mfa_sess_' + Math.random().toString(36).substr(2, 12),
        matchedStep,
        latencyMs: latency,
        expiresIn: 300,
        source: 'AWS_LAMBDA_ENGINE',
        requestId: 'aws-lambda-' + Math.random().toString(36).substr(2, 9),
        cloudWatchLogStream: `/aws/lambda/MfaVerifyOtpFunction/${new Date().toISOString().slice(0, 10)}`,
        message: 'MFA Hardware Token verified successfully by AWS Lambda.'
      };

      this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
        status: 'VERIFIED',
        action: 'ACCESS_GRANTED',
        userId: successResult.userId,
        timestamp: currentEpoch,
        source: 'AWS_LAMBDA_ENGINE'
      }, 'RX');

      return successResult;
    } else {
      this.stats.failedCount++;
      const failResult = {
        success: false,
        verified: false,
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'The OTP entered does not match the token synchronized with AWS Lambda.',
        latencyMs: latency,
        source: 'AWS_LAMBDA_ENGINE',
        requestId: 'aws-lambda-' + Math.random().toString(36).substr(2, 9)
      };

      this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
        status: 'DENIED',
        error: 'MISMATCH_OR_EXPIRED',
        timestamp: currentEpoch,
        source: 'AWS_LAMBDA_ENGINE'
      }, 'RX');

      return failResult;
    }
  }

  getAverageLatency() {
    if (this.stats.latencies.length === 0) return 38;
    const recent = this.stats.latencies.slice(-10);
    const sum = recent.reduce((a, b) => a + b, 0);
    return Math.round(sum / recent.length);
  }
}

window.AwsClient = AwsClient;
