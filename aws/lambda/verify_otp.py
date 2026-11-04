"""
AWS Lambda Function (Python): Verify MFA Physical Token OTP
Runtime: Python 3.12
Project: MFA Physical Token Simulator (Cloud Computing Product #2)
Author: Purna Chandar Reddy
"""

import os
import json
import time
import base64
import hmac
import hashlib
import struct
import boto3

TIME_STEP = 30
DRIFT_WINDOW = 1
DEFAULT_SECRET = os.environ.get("DEFAULT_SHARED_SECRET", "JBSWY3DPEHPK3PXP")
TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "MfaDevicesTable")

dynamodb = boto3.resource("dynamodb")
iot_client = boto3.client("iot-data")


def base32_decode(secret: str) -> bytes:
    """Pad and decode base32 secret."""
    missing_padding = len(secret) % 8
    if missing_padding != 0:
        secret += "=" * (8 - missing_padding)
    return base64.b32decode(secret, casefold=True)


def generate_totp(secret_base32: str, step: int) -> str:
    """Compute RFC 6238 TOTP using HMAC-SHA1."""
    key = base32_decode(secret_base32)
    # Pack counter as 8-byte big-endian integer
    msg = struct.pack(">Q", step)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    offset = h[-1] & 0x0F
    code = struct.unpack(">I", h[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(code % 1000000).zfill(6)


def handler(event, context):
    start_time = time.time()
    print("[MFA-LAMBDA-PY] Event received:", json.dumps(event))

    body = {}
    if "body" in event:
        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
    else:
        body = event

    device_id = body.get("deviceId", "ESP32-MFA-01")
    otp = str(body.get("otp", "")).strip()
    user_id = body.get("userId", "admin@cloudenterprise.io")

    if not otp or len(otp) != 6:
        return build_response(400, {"success": False, "error": "Invalid OTP. Expected 6 digits."})

    current_epoch = int(time.time())
    current_step = current_epoch // TIME_STEP

    # Validate against +/- 1 step drift
    is_valid = False
    matched_step = None

    for offset in range(-DRIFT_WINDOW, DRIFT_WINDOW + 1):
        test_step = current_step + offset
        expected_otp = generate_totp(DEFAULT_SECRET, test_step)
        if expected_otp == otp:
            is_valid = True
            matched_step = test_step
            break

    latency_ms = int((time.time() - start_time) * 1000)

    if is_valid:
        # Publish MQTT ack back to hardware token
        try:
            ack_payload = json.dumps({
                "status": "VERIFIED",
                "deviceId": device_id,
                "userId": user_id,
                "timestamp": current_epoch
            })
            iot_client.publish(
                topic=f"mfa/devices/{device_id}/ack",
                qos=1,
                payload=ack_payload.encode("utf-8")
            )
        except Exception as e:
            print("[WARN] IoT ACK publish error:", str(e))

        return build_response(200, {
            "success": True,
            "verified": True,
            "deviceId": device_id,
            "userId": user_id,
            "matchedStep": matched_step,
            "latencyMs": latency_ms,
            "message": "Token verified successfully by AWS Lambda (Python)."
        })
    else:
        return build_response(401, {
            "success": False,
            "verified": False,
            "error": "INVALID_OR_EXPIRED_TOKEN",
            "latencyMs": latency_ms
        })


def build_response(status_code: int, body_dict: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        "body": json.dumps(body_dict),
    }
