# MFA Physical Token Simulator - System Architecture

## 1. System Overview

The **MFA Physical Token Simulator** is an end-to-end cloud-connected multi-factor authentication system. It demonstrates how a dedicated hardware security token (such as an RSA SecurID, YubiKey, or banking authenticator) interfaces with enterprise cloud infrastructure to guarantee cryptographic zero-trust authentication.

```
+-----------------------------------------------------------------------------------+
|                            PHYSICAL HARDWARE LAYER                                |
|                                                                                   |
|  [ Tactile Button ] ----> [ ESP32 DevKit-C ] <----> [ 0.96" SSD1306 OLED Screen ]  |
|     (GPIO 4 Pullup)        - FreeRTOS                  - 128x64 Monochrome I2C    |
|                            - RFC 6238 TOTP Engine      - 6-digit OTP Display      |
|                            - MQTTS TLS 1.2 Client      - 30s TTL Countdown Bar    |
+-----------------------------------------------------------------------------------+
                                       |
                   MQTTS (Port 8883 / TLS 1.2 Mutual Auth)
                                       v
+-----------------------------------------------------------------------------------+
|                              AWS CLOUD BACKEND                                    |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | AWS IoT Core (Broker & Certificate Authority)                             |   |
|   |  - Thing: ESP32-MFA-01                                                    |   |
|   |  - Telemetry Topic: mfa/devices/{deviceId}/otp                            |   |
|   |  - Feedback Topic:  mfa/devices/{deviceId}/ack                            |   |
|   +---------------------------------------------------------------------------+   |
|                                       |                                           |
|                             IoT SQL Topic Rule                                    |
|                                       v                                           |
|   +---------------------------------------------------------------------------+   |
|   | AWS Lambda (Verification Engine)                                          |   |
|   |  - Computes Expected RFC 6238 HMAC-SHA1 Hash                              |   |
|   |  - Drift Window Compensation (+/- 1 Step = +/- 30s)                       |   |
|   |  - Replay Attack Prevention (Validates Step Token Monotonicity)           |   |
|   |  - Emits CloudWatch Audit Metrics                                         |   |
|   +---------------------------------------------------------------------------+   |
|                        |                                     ^                    |
|                        v                                     |                    |
|          +----------------------------+                      |                    |
|          | Amazon DynamoDB            |                      |                    |
|          |  - Table: MfaDevicesTable  |                      |                    |
|          |  - Table: MfaTelemetryLogs |                      |                    |
|          +----------------------------+                      |                    |
+--------------------------------------------------------------|--------------------+
                                                               |
                                                   REST API (HTTPS POST /verify)
                                                               |
+--------------------------------------------------------------v--------------------+
|                         CLIENT DASHBOARD & AUTH PORTAL                            |
|                                                                                   |
|  [ Enterprise Cloud Login ] <---> [ Interactive OLED & Hardware Emulator ]        |
|  [ Live Telemetry Stream  ] <---> [ RFC 6238 Cryptographic Step Visualizer ]      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Security & Zero-Trust Threat Model

### Zero-Knowledge Architecture
In standard insecure systems, the one-time code or credentials travel across multiple insecure hops. In this architecture:
1. **The Shared Secret ($K$) Never Leaves the Device/Cloud**:
   - The device holds the Base32 secret key $K$ provisioned into hardware NVS storage.
   - AWS Lambda reads $K$ securely from DynamoDB or AWS Secrets Manager.
   - **$K$ is never transmitted over the network**, preventing eavesdropping and Man-in-the-Middle (MitM) attacks.
2. **Mutual TLS (mTLS) Authentication**:
   - The ESP32 authenticates to AWS IoT Core using client X.509 certificates and an encrypted 2048-bit RSA private key.
   - AWS IoT Core authenticates itself via Amazon Root CA 1.
3. **Replay Attack Mitigation**:
   - Every time a token is verified, the matched counter step is written to the `MfaDevicesTable` in DynamoDB.
   - If an adversary captures an OTP and attempts to reuse it within the 30-second window, AWS Lambda detects that the step has already been consumed and immediately terminates the request with a `403 REPLAY_ATTACK_DETECTED`.
4. **Clock Drift Compensation**:
   - Due to network latency or NTP slight offsets, Lambda inspects the current step $S$, the previous step $S - 1$, and the next step $S + 1$. This provides seamless user authentication while maintaining tight security.

---

## 3. Cryptographic Algorithm (RFC 6238 TOTP)

The dynamic 6-digit code is calculated using the following mathematical sequence:

1. **Calculate Counter ($C$)**:
   $$\Delta T = 30 \text{ seconds (Time Window)}$$
   $$C = \left\lfloor \frac{T - T_0}{\Delta T} \right\rfloor$$
   Where $T$ is the current Unix epoch timestamp in seconds, and $T_0 = 0$.

2. **Compute HMAC-SHA1 Hash ($H$)**:
   $$H = \text{HMAC-SHA1}(K, C)$$
   Where $K$ is the decoded 20-byte shared secret, and $C$ is an 8-byte big-endian binary counter.

3. **Dynamic Truncation ($DT$)**:
   $$Offset = H[19] \ \& \ 0x0F$$
   $$P = (H[Offset] \ \& \ 0x7F) \ll 24 \mid (H[Offset+1] \ \& \ 0xFF) \ll 16 \mid (H[Offset+2] \ \& \ 0xFF) \ll 8 \mid (H[Offset+3] \ \& \ 0xFF)$$

4. **Modulo Reduction to 6 Digits**:
   $$\text{OTP} = P \pmod{10^6}$$
