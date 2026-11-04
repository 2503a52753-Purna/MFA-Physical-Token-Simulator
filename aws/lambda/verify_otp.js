/**
 * AWS Lambda Function: Verify MFA Physical Token OTP
 * Runtime: Node.js 20.x
 * Project: MFA Physical Token Simulator (Cloud Computing Product #2)
 * Author: Purna Chandar Reddy
 */

const crypto = require('crypto');
const { IoTDataPlaneClient, PublishCommand } = require('@aws-sdk/client-iot-data-plane');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS Clients (AWS region defaults to process.env.AWS_REGION)
const iotClient = new IoTDataPlaneClient({});
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const DDB_TABLE = process.env.DYNAMODB_TABLE || 'MfaDevicesTable';
const DEFAULT_SECRET = process.env.DEFAULT_SHARED_SECRET || 'JBSWY3DPEHPK3PXP';
const TIME_STEP = 30; // 30-second window
const DRIFT_WINDOW = 1; // Allow +/- 1 time step drift (prevents clock skew failures)

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

// Verification Handler
exports.handler = async (event) => {
  const startTime = Date.now();
  console.log('[MFA-LAMBDA] Received event:', JSON.stringify(event));

  // Handle API Gateway HTTP POST or direct invocation
  let body = {};
  if (event.body) {
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (err) {
      return buildResponse(400, {
        success: false,
        error: 'Invalid JSON request body'
      });
    }
  } else {
    body = event;
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

  // Retrieve Device Secret & Replay history from DynamoDB (with fallback)
  let deviceSecret = DEFAULT_SECRET;
  let lastUsedStep = -1;

  try {
    const getResult = await docClient.send(new GetCommand({
      TableName: DDB_TABLE,
      Key: { deviceId }
    }));

    if (getResult && getResult.Item) {
      deviceSecret = getResult.Item.sharedSecret || DEFAULT_SECRET;
      lastUsedStep = getResult.Item.lastUsedStep || -1;
    }
  } catch (dbErr) {
    console.warn('[MFA-LAMBDA] DynamoDB lookup skipped or failed (using env fallback):', dbErr.message);
  }

  // Validate against time window [-1, 0, +1]
  let isValid = false;
  let matchedStep = null;

  for (let offset = -DRIFT_WINDOW; offset <= DRIFT_WINDOW; offset++) {
    const testStep = currentStep + offset;
    const expectedOtp = generateTotp(deviceSecret, testStep);

    if (expectedOtp === cleanOtp) {
      if (testStep <= lastUsedStep) {
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
    console.log(`[AUTH-SUCCESS] Device: ${deviceId} | User: ${userId} | Step: ${matchedStep} | Latency: ${executionLatencyMs}ms`);

    // Update DynamoDB with consumed step to prevent replay attacks
    try {
      await docClient.send(new PutCommand({
        TableName: DDB_TABLE,
        Item: {
          deviceId,
          sharedSecret: deviceSecret,
          lastUsedStep: matchedStep,
          lastUsedOtp: cleanOtp,
          lastAuthUser: userId,
          lastAuthTimestamp: new Date().toISOString()
        }
      }));
    } catch (saveErr) {
      console.warn('[MFA-LAMBDA] Could not persist state to DynamoDB:', saveErr.message);
    }

    // Publish MQTT ACK event back to ESP32 OLED display
    try {
      const ackPayload = JSON.stringify({
        status: 'VERIFIED',
        action: 'ACCESS_GRANTED',
        deviceId,
        userId,
        timestamp: currentEpoch
      });

      await iotClient.send(new PublishCommand({
        topic: `mfa/devices/${deviceId}/ack`,
        payload: Buffer.from(ackPayload),
        qos: 1
      }));
      console.log(`[AWS-IOT] Published ACK to mfa/devices/${deviceId}/ack`);
    } catch (iotErr) {
      console.warn('[AWS-IOT] MQTT ACK publication skipped (IoT endpoint not bound):', iotErr.message);
    }

    // Generate simulated Auth Session Token
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
