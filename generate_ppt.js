const pptxgen = require('pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // Slide dimensions: Width = 10.0 in, Height = 5.625 in

// Exact boundary limits:
// Slide Width: 10.0 in (Usable: x = 0.6 to 9.4, max w = 8.8)
// Slide Height: 5.625 in (Usable: y = 0.35 to 5.2, max h = 4.85)

const COLORS = {
  bgDark: '0A0F1D',      // Deep Slate
  cardBg: '131B2E',      // Card Slate
  cyan: '00F3FF',        // Electric Cyan
  blue: '2563EB',        // Vivid Blue
  green: '10B981',       // Emerald Green
  amber: 'F59E0B',       // Amber Warning
  rose: 'EF4444',        // Rose / Red
  textWhite: 'FFFFFF',   // Pure White
  textLight: 'E2E8F0',   // Light Gray
  textMuted: '94A3B8',   // Muted Gray
  border: '1E293B'
};

// -------------------------------------------------------------
// SLIDE 1: Title & Blank Slots for 5 Team Members (100% Bounded)
// -------------------------------------------------------------
let slide1 = pres.addSlide();
slide1.background = { color: COLORS.bgDark };

// Header Tag
slide1.addText("CLOUD COMPUTING PRODUCT #2 • SEMESTER 3", {
  x: 0.6, y: 0.35, w: 8.8, h: 0.25,
  fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.cyan,
  charSpacing: 1.5
});

// Title
slide1.addText("MFA Physical Token Simulator", {
  x: 0.6, y: 0.65, w: 8.8, h: 0.5,
  fontSize: 24, fontFace: 'Arial', bold: true, color: COLORS.textWhite
});

// Subtitle
slide1.addText("Physical ESP32 Microcontroller + OLED Screen + AWS Cloud Lambda Verification Engine", {
  x: 0.6, y: 1.15, w: 8.8, h: 0.3,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textMuted
});

// Divider Line
slide1.addShape(pres.ShapeType.rect, {
  x: 0.6, y: 1.48, w: 8.8, h: 0.02,
  fill: { color: COLORS.cyan }
});

// Heading for Team Members
slide1.addText("Project Team Members & Roll Numbers:", {
  x: 0.6, y: 1.6, w: 8.8, h: 0.3,
  fontSize: 13, fontFace: 'Arial', bold: true, color: COLORS.textWhite
});

// Blank Slots Table (5 rows, perfectly bounded at w: 8.8, h: 2.5)
const memberRows = [
  [{ text: "Member 1:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 2:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 3:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 4:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 5:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }]
];

slide1.addTable(memberRows, {
  x: 0.6, y: 1.95, w: 8.8, h: 2.6,
  colW: [1.3, 4.8, 2.7],
  rowH: [0.48, 0.48, 0.48, 0.48, 0.48],
  fontSize: 12, fontFace: 'Arial', color: COLORS.textLight,
  fill: { color: COLORS.cardBg },
  border: { type: 'solid', pt: 1, color: COLORS.border }
});

// Footer Live Demo Link (Safe at y: 4.8)
slide1.addText("🌐 Live 24/7 Demo Link: https://2503a52753-purna.github.io/MFA-Physical-Token-Simulator/", {
  x: 0.6, y: 4.8, w: 8.8, h: 0.3,
  fontSize: 10, fontFace: 'Arial', color: COLORS.green, italic: true
});


// -------------------------------------------------------------
// Helper: Standard Slide Header within Boundaries
// -------------------------------------------------------------
function createBaseSlide(category, title) {
  let s = pres.addSlide();
  s.background = { color: COLORS.bgDark };

  s.addText(category.toUpperCase(), {
    x: 0.6, y: 0.35, w: 8.8, h: 0.25,
    fontSize: 9, fontFace: 'Arial', bold: true, color: COLORS.cyan, charSpacing: 1.5
  });

  s.addText(title, {
    x: 0.6, y: 0.6, w: 8.8, h: 0.45,
    fontSize: 20, fontFace: 'Arial', bold: true, color: COLORS.textWhite
  });

  s.addShape(pres.ShapeType.rect, {
    x: 0.6, y: 1.1, w: 8.8, h: 0.02,
    fill: { color: COLORS.border }
  });

  return s;
}


// -------------------------------------------------------------
// SLIDE 2: The Big Picture (2 Columns: x=0.6 to 4.8, x=5.2 to 9.4)
// -------------------------------------------------------------
let slide2 = createBaseSlide("Overview", "The Big Picture: Why Hardware MFA?");

// Left Card
slide2.addShape(pres.ShapeType.roundRect, {
  x: 0.6, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.rose, width: 1.5 }, rectRadius: 0.1
});
slide2.addText("❌ The Problem: Passwords & SMS", {
  x: 0.8, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.rose
});
slide2.addText([
  { text: "• Passwords are stolen easily:\n", options: { bold: true } },
  { text: "  Over 80% of data breaches involve stolen credentials.\n\n" },
  { text: "• SMS OTPs are easily hacked:\n", options: { bold: true } },
  { text: "  SIM-swapping & cellular spoofing intercept SMS.\n\n" },
  { text: "• Phishing Attacks:\n", options: { bold: true } },
  { text: "  Fake login pages easily trick users into typing static passwords." }
], {
  x: 0.8, y: 1.85, w: 3.8, h: 3.0,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});

// Right Card
slide2.addShape(pres.ShapeType.roundRect, {
  x: 5.2, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.green, width: 1.5 }, rectRadius: 0.1
});
slide2.addText("✅ Our Solution: Physical Hardware Token", {
  x: 5.4, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.green
});
slide2.addText([
  { text: "• Master Key Stays Offline:\n", options: { bold: true } },
  { text: "  Stored in ESP32 hardware — NEVER sent over internet.\n\n" },
  { text: "• 30-Second Dynamic Codes:\n", options: { bold: true } },
  { text: "  Generates single-use 6-digit codes synced with AWS.\n\n" },
  { text: "• Zero-Trust AWS Cloud Verification:\n", options: { bold: true } },
  { text: "  AWS Lambda verifies codes and blocks replay attacks instantly." }
], {
  x: 5.4, y: 1.85, w: 3.8, h: 3.0,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});


// -------------------------------------------------------------
// SLIDE 3: How It Works in 3 Steps (3 Columns: 2.7in each)
// Card 1: 0.6..3.3 | Card 2: 3.65..6.35 | Card 3: 6.7..9.4
// -------------------------------------------------------------
let slide3 = createBaseSlide("Architecture Flow", "How It Works in 3 Simple Steps");

const steps = [
  {
    num: "1",
    title: "1. Press Token Button",
    color: COLORS.cyan,
    desc: "User presses the button on the physical ESP32 token.\n\nThe microcontroller computes a fresh 6-digit OTP code on the OLED display valid for 30 seconds."
  },
  {
    num: "2",
    title: "2. Enter into Login",
    color: COLORS.blue,
    desc: "User types the temporary 6-digit code into the Enterprise Login screen.\n\nThe web dashboard also provides an Auto-Fill button for 1-second testing."
  },
  {
    num: "3",
    title: "3. AWS Cloud Verifies",
    color: COLORS.green,
    desc: "AWS Lambda computes the HMAC-SHA1 hash in the cloud.\n\nIt checks drift tolerance (±30s), saves the step in DynamoDB, and unlocks access in 38ms!"
  }
];

steps.forEach((st, idx) => {
  const xPos = 0.6 + idx * 3.05; // 0.6, 3.65, 6.7
  slide3.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: 1.25, w: 2.7, h: 3.8,
    fill: { color: COLORS.cardBg }, line: { color: st.color, width: 1.5 }, rectRadius: 0.1
  });

  slide3.addShape(pres.ShapeType.ellipse, {
    x: xPos + 1.0, y: 1.5, w: 0.7, h: 0.7,
    fill: { color: st.color }
  });
  slide3.addText(st.num, {
    x: xPos + 1.0, y: 1.5, w: 0.7, h: 0.7,
    fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.bgDark, align: 'center', valign: 'middle'
  });

  slide3.addText(st.title, {
    x: xPos + 0.15, y: 2.35, w: 2.4, h: 0.4,
    fontSize: 13, fontFace: 'Arial', bold: true, color: COLORS.textWhite, align: 'center'
  });

  slide3.addText(st.desc, {
    x: xPos + 0.15, y: 2.85, w: 2.4, h: 2.0,
    fontSize: 10, fontFace: 'Arial', color: COLORS.textLight, align: 'center', lineSpacing: 14
  });
});


// -------------------------------------------------------------
// SLIDE 4: Hardware Component (2 Columns)
// -------------------------------------------------------------
let slide4 = createBaseSlide("Hardware Layer", "ESP32 Hardware Token & OLED Screen");

// Left Column: Specs
slide4.addShape(pres.ShapeType.roundRect, {
  x: 0.6, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.1
});
slide4.addText("📟 Hardware Specifications", {
  x: 0.8, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.cyan
});
slide4.addText([
  { text: "• Microcontroller: ", options: { bold: true } },
  { text: "ESP32 DevKit-C v4 (Dual-Core 240MHz)\n" },
  { text: "• Display: ", options: { bold: true } },
  { text: "0.96\" SSD1306 Monochrome OLED (128x64)\n" },
  { text: "• Protocol: ", options: { bold: true } },
  { text: "I2C Interface (GPIO 21 SDA, GPIO 22 SCL)\n" },
  { text: "• Push Button: ", options: { bold: true } },
  { text: "Tactile Push Button (GPIO 4 Active-LOW)\n" },
  { text: "• Status LEDs: ", options: { bold: true } },
  { text: "Power, Wi-Fi, MQTT Transmit, and AWS Auth\n" },
  { text: "• Browser Simulation: ", options: { bold: true } },
  { text: "Full simulation via Wokwi Online Simulator!" }
], {
  x: 0.8, y: 1.85, w: 3.8, h: 3.0,
  fontSize: 10.5, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});

// Right Column: Pinout Table
slide4.addShape(pres.ShapeType.roundRect, {
  x: 5.2, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.1
});
slide4.addText("🔌 Circuit Pinout Table", {
  x: 5.4, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.green
});

const wiringRows = [
  [{ text: "Component Pin", options: { bold: true, color: COLORS.cyan } }, { text: "ESP32 Pin", options: { bold: true, color: COLORS.cyan } }, { text: "Description", options: { bold: true, color: COLORS.cyan } }],
  [{ text: "OLED SDA" }, { text: "GPIO 21" }, { text: "I2C Serial Data" }],
  [{ text: "OLED SCL" }, { text: "GPIO 22" }, { text: "I2C Serial Clock" }],
  [{ text: "OLED VCC" }, { text: "3V3" }, { text: "3.3V Power" }],
  [{ text: "OLED GND" }, { text: "GND" }, { text: "Ground" }],
  [{ text: "Button Pin 1" }, { text: "GPIO 4" }, { text: "Active-LOW Interrupt" }],
  [{ text: "Button Pin 2" }, { text: "GND" }, { text: "Ground Reference" }]
];

slide4.addTable(wiringRows, {
  x: 5.4, y: 1.85, w: 3.8, h: 2.8,
  colW: [1.3, 1.1, 1.4],
  fontSize: 10, fontFace: 'Arial', color: COLORS.textLight,
  fill: { color: COLORS.bgDark },
  border: { type: 'solid', pt: 1, color: COLORS.border }
});


// -------------------------------------------------------------
// SLIDE 5: AWS Cloud Backend (3 Columns)
// -------------------------------------------------------------
let slide5 = createBaseSlide("Cloud Layer", "AWS Cloud Backend Architecture");

const awsCards = [
  {
    title: "1. AWS IoT Core",
    tag: "MQTT Broker",
    color: COLORS.amber,
    desc: "• Mutual TLS 1.2 authenticated\n• Ingests token telemetry:\n  mfa/devices/{id}/otp\n• Publishes auth confirmation back to hardware screen."
  },
  {
    title: "2. AWS Lambda",
    tag: "Serverless Compute",
    color: COLORS.cyan,
    desc: "• Node.js 20.x compute engine\n• Computes RFC 6238 HMAC-SHA1\n• Handles ±30s clock drift\n• Exposes REST API & Function URL\n• Roundtrip latency: ~38ms!"
  },
  {
    title: "3. Amazon DynamoDB",
    tag: "Zero-Trust Store",
    color: COLORS.green,
    desc: "• Table: MfaDevicesTable\n• Stores device secret & consumed time steps\n• Enforces monotonic step checks to stop replay attacks."
  }
];

awsCards.forEach((c, idx) => {
  const xPos = 0.6 + idx * 3.05;
  slide5.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: 1.25, w: 2.7, h: 3.8,
    fill: { color: COLORS.cardBg }, line: { color: c.color, width: 1.5 }, rectRadius: 0.1
  });

  slide5.addText(c.title, {
    x: xPos + 0.15, y: 1.45, w: 2.4, h: 0.35,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.textWhite
  });

  slide5.addText(c.tag, {
    x: xPos + 0.15, y: 1.85, w: 2.4, h: 0.25,
    fontSize: 10, fontFace: 'Arial', color: c.color, bold: true
  });

  slide5.addText(c.desc, {
    x: xPos + 0.15, y: 2.2, w: 2.4, h: 2.6,
    fontSize: 10.5, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 15
  });
});


// -------------------------------------------------------------
// SLIDE 6: Replay Attack Defense (2 Columns)
// -------------------------------------------------------------
let slide6 = createBaseSlide("Zero-Trust Security", "Stopping Hacker Replay Attacks");

// Left Column: The Threat
slide6.addShape(pres.ShapeType.roundRect, {
  x: 0.6, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.rose, width: 1.5 }, rectRadius: 0.1
});
slide6.addText("🚨 What is a Replay Attack?", {
  x: 0.8, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.rose
});
slide6.addText([
  { text: "1. Normal User logs in:\n", options: { bold: true } },
  { text: "   User types their 6-digit code: 849201.\n\n" },
  { text: "2. Hacker intercepts code:\n", options: { bold: true } },
  { text: "   Hacker eavesdrops and captures code 849201 before its 30s window expires.\n\n" },
  { text: "3. Hacker re-submits the code:\n", options: { bold: true } },
  { text: "   In poorly designed systems, the hacker gets authenticated!" }
], {
  x: 0.8, y: 1.85, w: 3.8, h: 3.0,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});

// Right Column: The Defense
slide6.addShape(pres.ShapeType.roundRect, {
  x: 5.2, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.green, width: 1.5 }, rectRadius: 0.1
});
slide6.addText("🛡️ How AWS Blocks Replay Attacks", {
  x: 5.4, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.green
});
slide6.addText([
  { text: "1. Monotonic Step Recording:\n", options: { bold: true } },
  { text: "   Once a code is verified, AWS Lambda locks that step into DynamoDB.\n\n" },
  { text: "2. Zero-Trust Check:\n", options: { bold: true } },
  { text: "   If testStep <= lastUsedStep, AWS Lambda REJECTS with:\n" },
  { text: "   HTTP 403: REPLAY_ATTACK_DETECTED!\n\n", options: { color: COLORS.rose, bold: true } },
  { text: "3. Interactive Demo Button:\n", options: { bold: true } },
  { text: "   Click 'Test Hacker Replay Attack' in dashboard to see this happen live!" }
], {
  x: 5.4, y: 1.85, w: 3.8, h: 3.0,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});


// -------------------------------------------------------------
// SLIDE 7: Web Dashboard Features (Full Width Card)
// -------------------------------------------------------------
let slide7 = createBaseSlide("Web Application", "Interactive Web Dashboard & 1-Click Demo");

slide7.addShape(pres.ShapeType.roundRect, {
  x: 0.6, y: 1.25, w: 8.8, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.cyan, width: 1 }, rectRadius: 0.1
});

slide7.addText("🌟 Built for Simplicity: Anyone Can Understand & Test It in 2 Seconds", {
  x: 0.9, y: 1.45, w: 8.2, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.cyan
});

const dashFeatures = [
  { text: "• ⚡ 1-Click Auto Demo Button:\n", options: { bold: true } },
  { text: "  Generates code on ESP32, auto-fills login, and verifies on AWS Lambda automatically.\n\n" },
  { text: "• 📟 Photorealistic OLED Screen Emulator:\n", options: { bold: true } },
  { text: "  128x64 canvas with pixelated scanlines, animated 30s countdown bar, and audio synthesis.\n\n" },
  { text: "• 🛡️ Built-in Replay Attack Demonstration:\n", options: { bold: true } },
  { text: "  Tests submitting an already used code to showcase AWS security in real time.\n\n" },
  { text: "• 🔬 Expandable Deep-Dive Inspector Tabs:\n", options: { bold: true } },
  { text: "  Live MQTT stream, RFC 6238 HMAC-SHA1 step visualizer, UART serial monitor, and latency graph." }
];

slide7.addText(dashFeatures, {
  x: 0.9, y: 1.9, w: 8.2, h: 2.9,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});


// -------------------------------------------------------------
// SLIDE 8: AWS Learner Lab Permanent Connection (2 Columns)
// -------------------------------------------------------------
let slide8 = createBaseSlide("Cloud Deployment", "AWS Learner Lab: Permanent 24/7 Connection");

// Left Column: The Challenge
slide8.addShape(pres.ShapeType.roundRect, {
  x: 0.6, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.amber, width: 1.5 }, rectRadius: 0.1
});
slide8.addText("💡 Why Learner Lab Accounts Expire", {
  x: 0.8, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.amber
});
slide8.addText([
  { text: "• 4-Hour Session Timer:\n", options: { bold: true } },
  { text: "  CLI access keys and session tokens rotate after 4 hours.\n\n" },
  { text: "• BUT Cloud Resources DO NOT Expire:\n", options: { bold: true } },
  { text: "  Lambda functions and DynamoDB stay active in us-east-1 for the whole semester!\n\n" },
  { text: "• IAM Role Restriction:\n", options: { bold: true } },
  { text: "  Students cannot create IAM roles — must use built-in LabRole." }
], {
  x: 0.8, y: 1.85, w: 3.8, h: 3.0,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});

// Right Column: The Solution
slide8.addShape(pres.ShapeType.roundRect, {
  x: 5.2, y: 1.25, w: 4.2, h: 3.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.cyan, width: 1.5 }, rectRadius: 0.1
});
slide8.addText("🚀 How We Made It Permanently Connected", {
  x: 5.4, y: 1.4, w: 3.8, h: 0.35,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.cyan
});
slide8.addText([
  { text: "• Pre-Configured LabRole Template:\n", options: { bold: true } },
  { text: "  cloudformation-learner-lab.yaml uses LabRole — 0 permission errors!\n\n" },
  { text: "• Public HTTPS Lambda Function URL:\n", options: { bold: true } },
  { text: "  Direct CORS-enabled endpoint callable 24/7 without session tokens.\n\n" },
  { text: "• Triple-Layer Dashboard Persistence:\n", options: { bold: true } },
  { text: "  Saved in aws-config.json, localStorage, and URL parameters.\n\n" },
  { text: "• Built-in Ping Diagnostics:\n", options: { bold: true } },
  { text: "  1-click 'Test Connection' pings AWS live with status and latency." }
], {
  x: 5.4, y: 1.85, w: 3.8, h: 3.0,
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 16
});


// -------------------------------------------------------------
// SLIDE 9: Project Results & Performance Metrics (2x2 Grid)
// -------------------------------------------------------------
let slide9 = createBaseSlide("Results", "Key Achievements & Performance Metrics");

const metricCards = [
  { val: "38 ms", label: "Average Cloud Latency", sub: "Fast AWS Lambda + API Gateway roundtrip execution" },
  { val: "100%", label: "RFC 6238 Standard", sub: "HMAC-SHA1 with dynamic 31-bit truncation" },
  { val: "0 bytes", label: "Seed Over the Air", sub: "Master secret never transmitted across network" },
  { val: "24 / 7", label: "Public Web Access", sub: "Hosted live online with permanent cloud backend" }
];

metricCards.forEach((m, idx) => {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  const xPos = 0.6 + col * 4.6; // Col 0: 0.6, Col 1: 5.2
  const yPos = 1.35 + row * 1.95; // Row 0: 1.35, Row 1: 3.3

  slide9.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: yPos, w: 4.2, h: 1.75,
    fill: { color: COLORS.cardBg }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.1
  });

  slide9.addText(m.val, {
    x: xPos + 0.3, y: yPos + 0.15, w: 3.6, h: 0.5,
    fontSize: 24, fontFace: 'Arial', bold: true, color: COLORS.cyan
  });

  slide9.addText(m.label, {
    x: xPos + 0.3, y: yPos + 0.65, w: 3.6, h: 0.3,
    fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.textWhite
  });

  slide9.addText(m.sub, {
    x: xPos + 0.3, y: yPos + 1.0, w: 3.6, h: 0.55,
    fontSize: 9.5, fontFace: 'Arial', color: COLORS.textMuted
  });
});


// -------------------------------------------------------------
// SLIDE 10: Conclusion & Live Demonstration Link
// -------------------------------------------------------------
let slide10 = pres.addSlide();
slide10.background = { color: COLORS.bgDark };

slide10.addText("THANK YOU!", {
  x: 0.6, y: 0.8, w: 8.8, h: 0.8,
  fontSize: 36, fontFace: 'Arial', bold: true, color: COLORS.cyan, align: 'center'
});

slide10.addText("MFA Physical Token Simulator • Cloud Computing Product #2", {
  x: 0.6, y: 1.6, w: 8.8, h: 0.4,
  fontSize: 15, fontFace: 'Arial', color: COLORS.textWhite, align: 'center'
});

slide10.addShape(pres.ShapeType.roundRect, {
  x: 1.2, y: 2.3, w: 7.6, h: 2.3,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.green, width: 1.5 }, rectRadius: 0.1
});

slide10.addText("🌐 Live 24/7 Public Interactive Demo:", {
  x: 1.5, y: 2.6, w: 7.0, h: 0.35,
  fontSize: 13, fontFace: 'Arial', bold: true, color: COLORS.green, align: 'center'
});

slide10.addText("https://2503a52753-purna.github.io/MFA-Physical-Token-Simulator/", {
  x: 1.5, y: 3.05, w: 7.0, h: 0.5,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.cyan, align: 'center'
});

slide10.addText("Ready for Live Demonstration & Questions!", {
  x: 1.5, y: 3.65, w: 7.0, h: 0.35,
  fontSize: 11, fontFace: 'Arial', italic: true, color: COLORS.textMuted, align: 'center'
});


// -------------------------------------------------------------
// Save PPTX and Copy to dashboard/
// -------------------------------------------------------------
const outputPath = "MFA_Physical_Token_Simulator_Presentation.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("Successfully generated strictly-bounded PowerPoint presentation:", outputPath);
}).catch(err => {
  console.error("Error generating presentation:", err);
});
