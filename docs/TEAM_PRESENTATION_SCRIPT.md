# 🎤 5-Member Team Presentation Script & Viva Guide
## Project: MFA Physical Token Simulator (Cloud Computing Product #2)

This guide assigns clear, distinct, and simple speaking parts for all **5 batch members** so that the presentation is well-coordinated, natural, and easy to deliver.

---

### 👥 Team Member Assignment Overview

| Member | Slides | Section Owned | Speaking Duration |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Slide 1 & Slide 2** | Project Introduction, Team Intro & The Security Problem | ~1.5 mins |
| **Member 2** | **Slide 3** | How It Works in 3 Simple Steps (The Core Storyline) | ~1.5 mins |
| **Member 3** | **Slide 4** | Physical Microcontroller & Circuit Layer (ESP32 + OLED) | ~1.5 mins |
| **Member 4** | **Slide 5 & Slide 6** | AWS Cloud Architecture & Replay Attack Defense | ~2.0 mins |
| **Member 5** | **Slide 7, 8, 9 & 10** | Live Web Dashboard Demo, AWS Learner Lab Permanence & Conclusion | ~2.0 mins |

---

### 🗣️ Detailed Speaking Script

---

#### 👤 Member 1: Introduction & Problem Statement
*(Presenting Slides 1 & 2)*

> **Slide 1 (Title Slide):**
> *"Good morning/afternoon respected faculty and classmates. We are Batch [Your Batch Number], and today our 5-member team is presenting our Cloud Computing 2nd Product: the **MFA Physical Token Simulator**.*
> *Our team members are [Member 1], [Member 2], [Member 3], [Member 4], and [Member 5].*
> *In this project, we built a complete bank-grade hardware authentication token using an ESP32 microcontroller, an SSD1306 OLED screen, and an AWS Cloud-native serverless verification backend."*

> **Slide 2 (The Big Picture - Why Hardware MFA?):**
> *"To understand why our project is crucial, let's look at why conventional security fails.*
> *Today, more than 80% of data breaches happen because static passwords get stolen or leaked. Even SMS-based OTPs are vulnerable to SIM-swapping and cellular interception.*
> *Our solution is a **Physical Hardware MFA Token** — similar to what Swiss banks and enterprise systems use. The master secret key is burned directly into the ESP32 hardware and is **NEVER** transmitted over Wi-Fi or the internet. Instead, both the device and AWS calculate synchronous, single-use, 30-second codes. Now, [Member 2] will explain how this works step-by-step."*

---

#### 👤 Member 2: The 3-Step Architecture Flow
*(Presenting Slide 3)*

> **Slide 3 (How It Works in 3 Simple Steps):**
> *"Thank you, [Member 1]. Our entire system operates on 3 very simple, elegant steps that anyone can understand:*
>
> 1. ***Step 1: Press the Hardware Button:***
>    *The user presses the tactile push-button on the ESP32 token. Using the RFC 6238 TOTP standard, the microcontroller immediately calculates a fresh 6-digit one-time password and displays it on the 0.96-inch OLED screen along with a 30-second countdown bar.*
>
> 2. ***Step 2: Enter Code into the Login Portal:***
>    *The user enters this temporary 6-digit code into our Enterprise Cloud Login Portal (or clicks our handy 1-Click Auto-Fill helper in the web dashboard).*
>
> 3. ***Step 3: AWS Cloud Verifies Instantly:***
>    *The code is sent to AWS Lambda via HTTPS REST API. AWS Lambda computes the exact same cryptographic hash in the cloud, checks drift compensation for clock jitter, ensures the code hasn't been used before, and grants access in just 38 milliseconds!*
>
> *Next, [Member 3] will explain the physical microcontroller circuit and firmware."*

---

#### 👤 Member 3: Physical Hardware & Microcontroller Layer
*(Presenting Slide 4)*

> **Slide 4 (ESP32 Hardware & Circuit Wiring):**
> *"Thank you, [Member 2]. On the hardware layer, we used an **ESP32 DevKit-C v4** microcontroller paired with a 0.96-inch monochrome **SSD1306 OLED display** and a tactile push-button.*
>
> *Here is how the circuit is wired:*
> - *The OLED display connects via the **I2C serial protocol**: **GPIO 21** handles SDA (Serial Data), and **GPIO 22** handles SCL (Serial Clock), powered by 3.3V and Ground.*
> - *The tactile push-button connects between **GPIO 4** and Ground using the ESP32's internal pull-up resistor. When pressed, it triggers a hardware interrupt.*
> - *We also configured on-board status LEDs for Power, Wi-Fi connectivity, MQTT transmission, and AWS Authentication.*
> - *For users without physical hardware, we also fully configured the project for the **Wokwi Online Browser Simulator**.*
>
> *Now, [Member 4] will walk us through the AWS Cloud backend and our zero-trust replay attack defense."*

---

#### 👤 Member 4: AWS Cloud Backend & Replay Attack Defense
*(Presenting Slides 5 & 6)*

> **Slide 5 (AWS Cloud Native Architecture):**
> *"Thank you, [Member 3]. On the cloud backend, we leverage three serverless AWS services:*
> 1. ***AWS IoT Core:*** *Acts as our secure MQTT message broker operating over mutual TLS 1.2 on port 8883. It ingests token telemetry and publishes feedback back to the device.*
> 2. ***AWS Lambda:*** *Runs our verification engine using Node.js 20.x. It executes in just 38ms and includes a ±30-second drift compensation window to account for network latency.*
> 3. ***Amazon DynamoDB:*** *Stores registered hardware token seeds and tracks monotonic time steps to enforce zero-trust security."*

> **Slide 6 (Stopping Hacker Replay Attacks):**
> *"A critical security feature of our product is **Replay Attack Mitigation**.*
> *In a replay attack, a hacker intercepts a valid 6-digit code before its 30-second window expires and tries to log in with it. In standard systems, the hacker gets in!*
> *In our AWS backend, the moment a code is verified, AWS Lambda records that step in Amazon DynamoDB. If anyone tries to reuse that exact code, AWS immediately rejects the request with an **HTTP 403: REPLAY_ATTACK_DETECTED**.*
> *Now, [Member 5] will demonstrate our live web dashboard and how we permanently connected our AWS Learner Lab account."*

---

#### 👤 Member 5: Live Dashboard Demo, AWS Learner Lab Permanence & Conclusion
*(Presenting Slides 7, 8, 9 & 10)*

> **Slide 7 & 8 (Web Dashboard & AWS Learner Lab Permanent Connection):**
> *"Thank you, [Member 4]. We designed our web dashboard so that anyone can understand and test the system in just two seconds.*
> *It features an **interactive 1-Click Auto Demo**, a realistic OLED display emulator with mechanical click audio, and an expandable deep-dive inspector showing live MQTT packets and cryptographic math.*
>
> *A major innovation in our project is how we solved the **AWS Learner Lab** limitation:*
> *In AWS Learner Lab, temporary CLI credentials expire after 4 hours, and students cannot create custom IAM roles. We built a custom template using the pre-existing **LabRole** and deployed a **public HTTPS Lambda Function URL**.*
> *Because Lambda Function URLs and DynamoDB tables remain active 24/7 in `us-east-1` for the entire semester, our web dashboard stays **permanently connected** without needing new CLI session tokens!"*

> **Slide 9 & 10 (Results & Conclusion):**
> *"Here are our key achievements:*
> - *Average cloud execution latency: **38 milliseconds**.*
> - *100% compliance with the international **RFC 6238 TOTP** standard.*
> - *Zero seed transmission across the internet.*
> - *Hosted online 24/7 on **GitHub Pages**.*
>
> *Our project is live right now at **https://2503a52753-purna.github.io/MFA-Physical-Token-Simulator/**. We are now ready to demonstrate the live dashboard and answer any questions from the panel. Thank you!"*

---

### 💡 Viva Q&A Cheat Sheet (Top Questions Professors Ask)

**Q1: What is the difference between HOTP and TOTP?**
* **Answer**: HOTP (RFC 4226) is counter-based (increments every button press). TOTP (RFC 6238) is time-based, where the counter is calculated as `floor(Unix Epoch / 30)`.

**Q2: What happens if the ESP32 clock drifts by 10 seconds?**
* **Answer**: AWS Lambda has drift tolerance of $\pm 1$ step ($\pm 30$ seconds), so it smoothly validates the code even with slight network latency or clock drift.

**Q3: How do you prevent replay attacks?**
* **Answer**: DynamoDB stores `lastUsedStep`. If a submitted token matches `testStep <= lastUsedStep`, AWS Lambda rejects it with HTTP 403 `REPLAY_ATTACK_DETECTED`.

**Q4: How does the dashboard connect to AWS Learner Lab permanently?**
* **Answer**: The AWS Lambda Function URL is an open, permanent HTTPS endpoint in `us-east-1` that does not expire when the 4-hour CLI session times out.
