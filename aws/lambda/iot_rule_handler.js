/**
 * AWS Lambda IoT Rule Handler: Ingests raw MQTT messages published by ESP32 tokens
 * Triggered by AWS IoT Topic Rule: SELECT * FROM 'mfa/devices/+/otp'
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const TELEMETRY_TABLE = process.env.TELEMETRY_TABLE || 'MfaTelemetryLogs';

exports.handler = async (event) => {
  console.log('[IOT-RULE] Received telemetry from ESP32:', JSON.stringify(event));

  const { deviceId, otp, counter, timestamp, event: eventType } = event;

  const item = {
    deviceId: deviceId || 'UNKNOWN',
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    counter: counter || 0,
    otp: otp || '------',
    eventType: eventType || 'OTP_GENERATED',
    receivedAt: new Date().toISOString()
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TELEMETRY_TABLE,
      Item: item
    }));
    console.log('[IOT-RULE] Persisted telemetry item:', item.deviceId, item.timestamp);
  } catch (err) {
    console.warn('[IOT-RULE] DynamoDB PutCommand error:', err.message);
  }

  return { status: 'RECORDED', item };
};
