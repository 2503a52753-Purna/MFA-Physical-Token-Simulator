/**
 * aws-client.js - AWS Cloud Integration Client & Lambda Verification Simulator
 * Handles real AWS API Gateway HTTP/REST calls with automatic fallback to built-in Lambda simulation
 * Author: Purna Chandar Reddy
 */

class AwsClient {
  constructor() {
    this.region = localStorage.getItem('aws_region') || 'us-east-1';
    this.apiEndpoint = localStorage.getItem('aws_api_endpoint') || '';
    this.iotEndpoint = localStorage.getItem('aws_iot_endpoint') || 'a1b2c3d4e5f6g7-ats.iot.us-east-1.amazonaws.com';
    this.mode = this.apiEndpoint ? 'live' : 'simulated'; // 'live' or 'simulated'
    this.consumedSteps = new Set(); // Replay attack prevention store
    this.logs = [];
    this.mqttStream = [];
    this.stats = {
      generatedCount: 0,
      verifiedCount: 0,
      failedCount: 0,
      replayAttempts: 0,
      latencies: []
    };
  }

  setEndpoints(region, apiEndpoint, iotEndpoint) {
    this.region = region || this.region;
    this.apiEndpoint = (apiEndpoint || '').trim();
    this.iotEndpoint = (iotEndpoint || '').trim();
    this.mode = this.apiEndpoint ? 'live' : 'simulated';

    localStorage.setItem('aws_region', this.region);
    localStorage.setItem('aws_api_endpoint', this.apiEndpoint);
    localStorage.setItem('aws_iot_endpoint', this.iotEndpoint);
  }

  // Publish simulated or real MQTT frame
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

  // Send MFA verification request
  async verifyOtp({ deviceId, otp, userId, totpEngine }) {
    const startTime = performance.now();
    const cleanOtp = String(otp).trim();

    // If Live AWS API Endpoint is configured, call real AWS API Gateway / Lambda
    if (this.mode === 'live' && this.apiEndpoint) {
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ deviceId, otp: cleanOtp, userId })
        });

        const data = await response.json();
        const latency = Math.round(performance.now() - startTime);
        data.latencyMs = data.latencyMs || latency;

        if (response.ok && data.verified) {
          this.stats.verifiedCount++;
          this.stats.latencies.push(data.latencyMs);
          this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
            status: 'VERIFIED',
            action: 'ACCESS_GRANTED',
            userId,
            cloudSource: 'AWS_LIVE_LAMBDA'
          }, 'RX');
        } else {
          this.stats.failedCount++;
          this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
            status: 'DENIED',
            error: data.error || 'INVALID_TOKEN',
            cloudSource: 'AWS_LIVE_LAMBDA'
          }, 'RX');
        }
        return data;
      } catch (err) {
        console.warn('Real AWS endpoint fetch failed, falling back to simulated Lambda engine:', err);
        // Fallback to simulated engine below
      }
    }

    // Built-in AWS Lambda Verification Engine Simulation
    // Emulates AWS Lambda cold-start/warm execution latency (35ms - 75ms)
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 40) + 35));

    const currentEpoch = Math.floor(Date.now() / 1000);
    const currentStep = totpEngine.getCurrentStep(currentEpoch);
    const latency = Math.round(performance.now() - startTime);

    // 1. Check for replay attack
    let matchedStep = null;
    let isValid = false;

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
            message: 'SECURITY ALERT: This OTP was already consumed! Replay attack prevented by AWS Lambda.',
            step,
            latencyMs: latency,
            requestId: 'aws-req-' + Math.random().toString(36).substr(2, 9)
          };
          this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
            status: 'REPLAY_DENIED',
            step,
            error: 'TOKEN_ALREADY_USED'
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
        requestId: 'aws-lambda-' + Math.random().toString(36).substr(2, 9),
        cloudWatchLogStream: `/aws/lambda/MfaVerifyOtpFunction/${new Date().toISOString().slice(0, 10)}`,
        message: 'MFA Hardware Token verified successfully by AWS Lambda.'
      };

      this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
        status: 'VERIFIED',
        action: 'ACCESS_GRANTED',
        userId: successResult.userId,
        timestamp: currentEpoch
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
        requestId: 'aws-lambda-' + Math.random().toString(36).substr(2, 9)
      };

      this.recordMqttMessage(`mfa/devices/${deviceId}/ack`, {
        status: 'DENIED',
        error: 'MISMATCH_OR_EXPIRED',
        timestamp: currentEpoch
      }, 'RX');

      return failResult;
    }
  }

  getAverageLatency() {
    if (this.stats.latencies.length === 0) return 42;
    const sum = this.stats.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.stats.latencies.length);
  }
}

window.AwsClient = AwsClient;
