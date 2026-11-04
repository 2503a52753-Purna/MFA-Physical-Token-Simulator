# MFA Physical Token Simulator (Cloud Computing Product #2)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardware: ESP32](https://img.shields.io/badge/Hardware-ESP32-red.svg)](https://www.espressif.com/)
[![Display: SSD1306 OLED](https://img.shields.io/badge/Display-SSD1306%20OLED-blue.svg)](https://adafruit.com)
[![Cloud: AWS IoT Core](https://img.shields.io/badge/AWS-IoT%20Core-orange.svg)](https://aws.amazon.com/iot-core/)
[![Compute: AWS Lambda](https://img.shields.io/badge/AWS-Lambda%20Verification-orange.svg)](https://aws.amazon.com/lambda/)
[![Standard: RFC 6238 TOTP](https://img.shields.io/badge/Standard-RFC%206238%20TOTP-green.svg)](https://datatracker.ietf.org/doc/html/rfc6238)

> **Cloud Computing Product #2**: An enterprise-grade Multi-Factor Authentication (MFA) hardware token simulator. A physical push-button generates a cryptographically synchronized dynamic OTP displayed on an SSD1306 OLED screen; an AWS Lambda function verifies it against the hardware secret with drift tolerance and replay attack protection.

---

## 🌟 Project Highlights

- **Physical Microcontroller Firmware**: Full Arduino C++ and PlatformIO firmware for ESP32 with hardware debouncing, mutual TLS 1.2 (X.509 certificates), and NTP epoch synchronization.
- **Realistic SSD1306 0.96" OLED UI**: Custom graphical interface with signal indicators, animated 30-second TTL countdown bar, and authorization response overlays (`[ACCESS GRANTED]`).
- **AWS Cloud Native Backend**:
  - **AWS IoT Core**: Secure MQTT broker (`mfa/devices/+/otp` and feedback topic `mfa/devices/+/ack`).
  - **AWS Lambda**: Node.js 20.x & Python 3.12 verification handlers with RFC 6238 HMAC-SHA1 calculation and $\pm 1$ window drift compensation.
  - **Amazon DynamoDB**: Monotonic step tracking for zero-trust **replay attack mitigation**.
  - **Amazon API Gateway (HTTP API)**: RESTful verification endpoint with CORS enabled for client dashboard integration.
- **Interactive Web Dashboard**:
  - Photorealistic ESP32 hardware emulator with tactile 3D push-button and audio synthesis.
  - Virtual 115200-baud UART Serial Monitor.
  - Live MQTT packet stream inspector.
  - Enterprise MFA login verification terminal.
  - Interactive RFC 6238 cryptographic calculation inspector.
  - Live latency telemetry graph (Chart.js).
- **Zero-Hardware Simulation**: Fully configured for [Wokwi Online Simulator](https://wokwi.com) via `firmware/diagram.json`.

---

## 🏛️ System Architecture

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

## 🔌 Hardware Circuit & Pinout

| Component | Pin | ESP32 GPIO | Description |
| :--- | :--- | :--- | :--- |
| **SSD1306 OLED** | **SDA** | **GPIO 21** | I2C Serial Data |
| **SSD1306 OLED** | **SCL** | **GPIO 22** | I2C Serial Clock |
| **SSD1306 OLED** | **VCC** | **3V3** | 3.3V Regulated Power |
| **SSD1306 OLED** | **GND** | **GND** | Ground |
| **Push Button** | **Terminal 1** | **GPIO 4** | Active LOW (Internal `INPUT_PULLUP`) |
| **Push Button** | **Terminal 2** | **GND** | Ground Reference |

---

## 📁 Repository Structure

```
CCProduct2/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml          # GitHub Pages CI/CD workflow
├── aws/
│   ├── cloudformation.yaml           # Complete AWS IaC Infrastructure Template
│   ├── deploy.ps1                    # PowerShell deployment automation
│   ├── deploy.sh                     # Bash deployment automation
│   ├── lambda/
│   │   ├── verify_otp.js             # Node.js 20.x Lambda Verification Handler
│   │   ├── verify_otp.py             # Python 3.12 Lambda Verification Handler
│   │   ├── iot_rule_handler.js       # AWS IoT SQL Topic Rule Ingester
│   │   └── test_verify.js            # Cryptographic Unit Test Suite
│   └── policies/
│       └── esp32-iot-policy.json     # AWS IoT Least-Privilege IAM Policy
├── dashboard/
│   ├── index.html                    # Responsive Single-Page Dashboard
│   ├── css/
│   │   └── styles.css                # Custom glassmorphism & OLED scanline effects
│   └── js/
│       ├── app.js                    # Core event controller & lifecycle
│       ├── oled-emulator.js          # Pixel-exact SSD1306 Canvas Renderer
│       ├── totp-engine.js            # RFC 6238 TOTP WebCrypto Implementation
│       ├── aws-client.js             # AWS Lambda & IoT Core Client / Mock
│       └── ui-components.js          # Synthesized Audio, Toasts & Serial Monitor
├── docs/
│   ├── ARCHITECTURE.md               # Detailed System Architecture & Zero-Trust Model
│   ├── CIRCUIT_WIRING.md             # Breadboard Wiring Schematic & Pinout
│   ├── AWS_SETUP_GUIDE.md            # Step-by-step AWS IoT & Lambda Tutorial
│   └── WOKWI_SIMULATION.md           # Online Browser Simulation Instructions
├── firmware/
│   ├── esp32_mfa_token/
│   │   ├── esp32_mfa_token.ino       # Production Arduino IDE Firmware
│   │   ├── config.h                  # Hardware Pins & Constant Settings
│   │   └── secrets.h.example         # Wi-Fi & AWS Certificate Credentials Template
│   ├── diagram.json                  # Wokwi Circuit Schematic
│   ├── platformio.ini                # PlatformIO Build File & Dependencies
│   └── wokwi.toml                    # Wokwi Config
├── server.js                         # Local Node.js Development Server & API Mock
├── package.json                      # Project Configuration
├── LICENSE                           # MIT License
└── README.md                         # Product Documentation
```

---

## 🚀 Quick Start Guide

### 1. Run the Dashboard Locally
Clone the repository and launch the dashboard locally in seconds:

```bash
# Clone the repository
git clone https://github.com/2503a52753-Purna/MFA-Physical-Token-Simulator.git
cd MFA-Physical-Token-Simulator

# Start the local dashboard & AWS Lambda mock server
npm start
```
Visit **`http://localhost:3000`** in your browser.

> **Note**: You can also simply open `dashboard/index.html` directly in any web browser without running any commands!

### 2. Run Cryptographic Unit Tests
Validate RFC 6238 mathematical compliance and drift tolerance:
```bash
npm test
```

### 3. Deploy to AWS Cloud
Deploy the AWS IoT Core, Lambda, DynamoDB, and API Gateway infrastructure using the automated CloudFormation script:

**PowerShell (Windows)**:
```powershell
.\aws\deploy.ps1 -Region us-east-1
```

**Bash (Linux / macOS)**:
```bash
chmod +x aws/deploy.sh
./aws/deploy.sh
```

---

## 🔒 Security & Cryptographic Breakdown

### Why Hardware MFA is Superior to SMS / Email
- **Zero Network Transmission of Seed**: The Base32 shared secret key ($K$) is burned into hardware storage during factory provisioning. It is **never sent over the Wi-Fi or Internet**.
- **Time-Synchronized Cryptography**: Both the ESP32 and AWS Lambda independently compute:
  $$\text{Step} = \left\lfloor \frac{\text{Unix Timestamp}}{30} \right\rfloor$$
  $$\text{Hash} = \text{HMAC-SHA1}(K, \text{Step})$$
- **Replay Protection**: Every verified OTP consumes the step timestamp in DynamoDB. Even if an adversary captures an active OTP, AWS Lambda denies reuse.
- **Clock Drift Tolerance**: Accounts for up to $\pm 30$ seconds of clock jitter between the microcontroller and AWS servers.

---

## 🧪 Browser-Only Hardware Simulation (Wokwi)

Don't have an ESP32 on hand? Simulate the physical hardware entirely in your browser:
1. Open [Wokwi ESP32 Simulator](https://wokwi.com/projects/new/esp32).
2. Paste `firmware/esp32_mfa_token/esp32_mfa_token.ino` into the code tab.
3. Paste `firmware/diagram.json` into the `diagram.json` tab.
4. Click **Play** and press the green button to generate tokens!

---

## 👨‍💻 Author & Project Info

- **Product**: Cloud Computing 2nd Product
- **Author**: Purna Chandar Reddy
- **Topic**: MFA Physical Token Simulator (ESP32 + OLED + AWS IoT Core + AWS Lambda)
- **License**: MIT
