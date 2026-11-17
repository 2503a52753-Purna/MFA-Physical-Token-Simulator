const pptxgen = require('pptxgenjs');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';

// Color Palette
const COLORS = {
  bgDark: '0A0F1D',      // Deep Navy / Slate
  cardBg: '131B2E',      // Card background
  cyan: '00F3FF',        // Accent Cyan
  blue: '2563EB',        // Royal Blue
  green: '10B981',       // Emerald Green
  amber: 'F59E0B',       // Amber
  textWhite: 'FFFFFF',   // Pure White
  textLight: 'E2E8F0',   // Light Slate
  textMuted: '94A3B8',   // Muted Slate
  border: '1E293B'
};

// -------------------------------------------------------------
// SLIDE 1: Title Slide with Blank Slots for 5 Team Members
// -------------------------------------------------------------
let slide1 = pres.addSlide();
slide1.background = { color: COLORS.bgDark };

// Header Tag
slide1.addText("CLOUD COMPUTING PRODUCT #2 • SEMESTER 3", {
  x: 0.8, y: 0.6, w: 11.7, h: 0.4,
  fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.cyan,
  charSpacing: 2
});

// Title
slide1.addText("MFA Physical Token Simulator", {
  x: 0.8, y: 1.0, w: 11.7, h: 0.9,
  fontSize: 34, fontFace: 'Arial', bold: true, color: COLORS.textWhite
});

// Subtitle
slide1.addText("Physical ESP32 Microcontroller + OLED Display + AWS Cloud Lambda Verification Engine", {
  x: 0.8, y: 1.9, w: 11.7, h: 0.4,
  fontSize: 14, fontFace: 'Arial', color: COLORS.textMuted
});

// Divider Line
slide1.addShape(pres.ShapeType.rect, {
  x: 0.8, y: 2.4, w: 11.7, h: 0.03,
  fill: { color: COLORS.cyan }
});

// Heading for Team Members
slide1.addText("Project Team Members & Roll Numbers:", {
  x: 0.8, y: 2.7, w: 11.7, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.textWhite
});

// Blank Slots for 5 Team Members (Clean Table / Card format)
const memberRows = [
  [{ text: "Member 1:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 2:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 3:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 4:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }],
  [{ text: "Member 5:", options: { bold: true, color: COLORS.cyan } }, { text: "Name: ____________________________________" }, { text: "Roll No: __________________" }]
];

slide1.addTable(memberRows, {
  x: 0.8, y: 3.2, w: 11.7, h: 2.8,
  colW: [1.5, 6.7, 3.5],
  fontSize: 14, fontFace: 'Arial', color: COLORS.textLight,
  fill: { color: COLORS.cardBg },
  border: { type: 'solid', pt: 1, color: COLORS.border }
});

slide1.addText("🌐 Live 24/7 Demo Link: https://2503a52753-purna.github.io/MFA-Physical-Token-Simulator/", {
  x: 0.8, y: 6.5, w: 11.7, h: 0.4,
  fontSize: 11, fontFace: 'Arial', color: COLORS.green, italic: true
});


// -------------------------------------------------------------
// Helper function for standard content slides
// -------------------------------------------------------------
function createBaseSlide(category, title) {
  let s = pres.addSlide();
  s.background = { color: COLORS.bgDark };

  s.addText(category.toUpperCase(), {
    x: 0.8, y: 0.4, w: 11.7, h: 0.3,
    fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.cyan, charSpacing: 1.5
  });

  s.addText(title, {
    x: 0.8, y: 0.7, w: 11.7, h: 0.6,
    fontSize: 24, fontFace: 'Arial', bold: true, color: COLORS.textWhite
  });

  s.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 1.35, w: 11.7, h: 0.02,
    fill: { color: COLORS.border }
  });

  return s;
}


// -------------------------------------------------------------
// SLIDE 2: The Big Picture (Problem & Solution)
// -------------------------------------------------------------
let slide2 = createBaseSlide("Overview", "The Big Picture: Why Hardware MFA?");

slide2.addShape(pres.ShapeType.roundRect, {
  x: 0.8, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: 'EF4444', width: 1.5 }, rectRadius: 0.15
});
slide2.addText("❌ The Problem: Passwords & SMS are Weak", {
  x: 1.1, y: 1.8, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: 'EF4444'
});
slide2.addText([
  { text: "• Passwords are stolen:", options: { bold: true, break: true } },
  { text: "  Over 80% of data breaches involve stolen passwords.\n\n" },
  { text: "• SMS OTPs are easily hacked:", options: { bold: true, break: true } },
  { text: "  SIM-swapping & network interception compromise SMS OTPs.\n\n" },
  { text: "• Phishing Attacks:", options: { bold: true, break: true } },
  { text: "  Fake login pages easily trick users into typing static credentials." }
], {
  x: 1.1, y: 2.3, w: 5.0, h: 3.8,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 20
});

slide2.addShape(pres.ShapeType.roundRect, {
  x: 6.9, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.green, width: 1.5 }, rectRadius: 0.15
});
slide2.addText("✅ Our Solution: Physical Hardware Token", {
  x: 7.2, y: 1.8, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.green
});
slide2.addText([
  { text: "• Cryptographic Master Key Stays Offline:", options: { bold: true, break: true } },
  { text: "  Stored in ESP32 hardware — NEVER sent over internet.\n\n" },
  { text: "• Dynamic 30-Second Codes:", options: { bold: true, break: true } },
  { text: "  Generates a single-use 6-digit code synchronized with AWS.\n\n" },
  { text: "• Bank-Grade Zero-Trust Cloud Verification:", options: { bold: true, break: true } },
  { text: "  AWS Lambda verifies the code and blocks replay attacks instantly." }
], {
  x: 7.2, y: 2.3, w: 5.0, h: 3.8,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 20
});


// -------------------------------------------------------------
// SLIDE 3: How It Works in 3 Simple Steps
// -------------------------------------------------------------
let slide3 = createBaseSlide("Architecture Flow", "How It Works in 3 Simple Steps");

const steps = [
  {
    num: "1",
    title: "Press Hardware Button",
    color: COLORS.cyan,
    desc: "The user presses the push button on the ESP32 token.\n\nThe microcontroller instantly computes a secure 6-digit code on the OLED display that changes every 30 seconds."
  },
  {
    num: "2",
    title: "Enter 6-Digit Code",
    color: COLORS.blue,
    desc: "The user enters this temporary 6-digit code into the Enterprise Cloud Login screen.\n\nThe dashboard also provides a 1-Click Auto-Fill button for instant testing."
  },
  {
    num: "3",
    title: "AWS Cloud Verifies",
    color: COLORS.green,
    desc: "AWS Lambda calculates the cryptographic hash independently.\n\nIt checks time drift tolerance (±30s), validates single-use rules, and unlocks access in 38ms!"
  }
];

steps.forEach((st, idx) => {
  const xPos = 0.8 + idx * 4.0;
  slide3.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: 1.7, w: 3.7, h: 4.6,
    fill: { color: COLORS.cardBg }, line: { color: st.color, width: 1.5 }, rectRadius: 0.15
  });

  slide3.addShape(pres.ShapeType.ellipse, {
    x: xPos + 1.45, y: 2.0, w: 0.8, h: 0.8,
    fill: { color: st.color }
  });
  slide3.addText(st.num, {
    x: xPos + 1.45, y: 2.0, w: 0.8, h: 0.8,
    fontSize: 20, fontFace: 'Arial', bold: true, color: COLORS.bgDark, align: 'center', valign: 'middle'
  });

  slide3.addText(st.title, {
    x: xPos + 0.2, y: 3.0, w: 3.3, h: 0.6,
    fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.textWhite, align: 'center'
  });

  slide3.addText(st.desc, {
    x: xPos + 0.3, y: 3.7, w: 3.1, h: 2.3,
    fontSize: 12, fontFace: 'Arial', color: COLORS.textLight, align: 'center', lineSpacing: 18
  });
});


// -------------------------------------------------------------
// SLIDE 4: Physical Hardware Component (ESP32 + OLED)
// -------------------------------------------------------------
let slide4 = createBaseSlide("Hardware Layer", "ESP32 Microcontroller & OLED Screen");

slide4.addShape(pres.ShapeType.roundRect, {
  x: 0.8, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.15
});

slide4.addText("📟 Hardware Specifications", {
  x: 1.1, y: 1.9, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.cyan
});

slide4.addText([
  { text: "• Microcontroller: ", options: { bold: true } },
  { text: "ESP32 DevKit-C v4 (Dual-Core 240MHz)\n" },
  { text: "• Display: ", options: { bold: true } },
  { text: "0.96\" SSD1306 Monochrome OLED (128x64 px)\n" },
  { text: "• Protocol: ", options: { bold: true } },
  { text: "I2C Interface (GPIO 21 SDA, GPIO 22 SCL)\n" },
  { text: "• Button: ", options: { bold: true } },
  { text: "Tactile Push Button (GPIO 4 Active-LOW)\n" },
  { text: "• Status LEDs: ", options: { bold: true } },
  { text: "Power, Wi-Fi, MQTT Transmit, and AWS Auth\n" },
  { text: "• Zero-Hardware: ", options: { bold: true } },
  { text: "Fully compatible with Wokwi Online Simulator!" }
], {
  x: 1.1, y: 2.4, w: 5.0, h: 3.7,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 20
});

slide4.addShape(pres.ShapeType.roundRect, {
  x: 6.9, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.15
});

slide4.addText("🔌 Wiring Pinout Table", {
  x: 7.2, y: 1.9, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.green
});

const wiringRows = [
  [{ text: "Component Pin", options: { bold: true, color: COLORS.cyan } }, { text: "ESP32 Pin", options: { bold: true, color: COLORS.cyan } }, { text: "Function", options: { bold: true, color: COLORS.cyan } }],
  [{ text: "OLED SDA" }, { text: "GPIO 21" }, { text: "I2C Serial Data" }],
  [{ text: "OLED SCL" }, { text: "GPIO 22" }, { text: "I2C Serial Clock" }],
  [{ text: "OLED VCC" }, { text: "3V3" }, { text: "3.3V Regulated Power" }],
  [{ text: "OLED GND" }, { text: "GND" }, { text: "Common Ground" }],
  [{ text: "Button Pin 1" }, { text: "GPIO 4" }, { text: "Trigger Interrupt" }],
  [{ text: "Button Pin 2" }, { text: "GND" }, { text: "Ground Reference" }]
];

slide4.addTable(wiringRows, {
  x: 7.2, y: 2.5, w: 5.0, h: 3.5,
  colW: [1.8, 1.4, 1.8],
  fontSize: 11, fontFace: 'Arial', color: COLORS.textLight,
  fill: { color: COLORS.bgDark },
  border: { type: 'solid', pt: 1, color: COLORS.border }
});


// -------------------------------------------------------------
// SLIDE 5: AWS Cloud Backend Architecture
// -------------------------------------------------------------
let slide5 = createBaseSlide("Cloud Layer", "AWS Cloud Backend Architecture");

const awsCards = [
  {
    title: "1. AWS IoT Core",
    tag: "MQTT Broker",
    color: COLORS.amber,
    desc: "• Mutual TLS 1.2 authenticated\n• Ingests token telemetry on topic:\n  mfa/devices/{id}/otp\n• Publishes auth confirmation back to hardware screen."
  },
  {
    title: "2. AWS Lambda",
    tag: "Serverless Verification",
    color: COLORS.cyan,
    desc: "• Node.js 20.x compute engine\n• Computes RFC 6238 HMAC-SHA1\n• Handles ±30 second clock drift\n• Exposes REST API & Function URL\n• Roundtrip latency: ~38ms!"
  },
  {
    title: "3. Amazon DynamoDB",
    tag: "Zero-Trust Database",
    color: COLORS.green,
    desc: "• Table: MfaDevicesTable\n• Stores device secret & last consumed time step\n• Enforces monotonic step checks to stop replay attacks permanently."
  }
];

awsCards.forEach((c, idx) => {
  const xPos = 0.8 + idx * 4.0;
  slide5.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: 1.7, w: 3.7, h: 4.6,
    fill: { color: COLORS.cardBg }, line: { color: c.color, width: 1.5 }, rectRadius: 0.15
  });

  slide5.addText(c.title, {
    x: xPos + 0.3, y: 2.0, w: 3.1, h: 0.4,
    fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.textWhite
  });

  slide5.addText(c.tag, {
    x: xPos + 0.3, y: 2.4, w: 3.1, h: 0.3,
    fontSize: 11, fontFace: 'Arial', color: c.color, bold: true
  });

  slide5.addText(c.desc, {
    x: xPos + 0.3, y: 2.9, w: 3.1, h: 3.0,
    fontSize: 12, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 18
  });
});


// -------------------------------------------------------------
// SLIDE 6: Replay Attack Prevention (Zero-Trust Security)
// -------------------------------------------------------------
let slide6 = createBaseSlide("Security", "Zero-Trust Security: Stopping Replay Attacks");

slide6.addShape(pres.ShapeType.roundRect, {
  x: 0.8, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: 'EF4444', width: 1.5 }, rectRadius: 0.15
});

slide6.addText("🚨 What is a Replay Attack?", {
  x: 1.1, y: 1.9, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: 'EF4444'
});

slide6.addText([
  { text: "1. Normal User logs in:", options: { bold: true, break: true } },
  { text: "   User types their 6-digit code: 849201.\n\n" },
  { text: "2. Hacker eavesdrops on network:", options: { bold: true, break: true } },
  { text: "   Hacker intercepts code 849201 before its 30s window expires.\n\n" },
  { text: "3. Hacker re-submits the same code:", options: { bold: true, break: true } },
  { text: "   In poorly designed systems, the hacker gets authenticated!" }
], {
  x: 1.1, y: 2.4, w: 5.0, h: 3.7,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 20
});

slide6.addShape(pres.ShapeType.roundRect, {
  x: 6.9, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.green, width: 1.5 }, rectRadius: 0.15
});

slide6.addText("🛡️ How AWS Blocks Replay Attacks", {
  x: 7.2, y: 1.9, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.green
});

slide6.addText([
  { text: "1. Monotonic Step Recording:", options: { bold: true, break: true } },
  { text: "   Once a code is verified, AWS Lambda records that step in DynamoDB.\n\n" },
  { text: "2. Zero-Trust Check:", options: { bold: true, break: true } },
  { text: "   If testStep <= lastUsedStep, AWS Lambda REJECTS with:\n" },
  { text: "   HTTP 403: REPLAY_ATTACK_DETECTED!\n\n", options: { color: 'F87171', bold: true } },
  { text: "3. Interactive Demo Feature:", options: { bold: true, break: true } },
  { text: "   Click 'Test Hacker Replay Attack' in the dashboard to see AWS actively block duplicate token usage live!" }
], {
  x: 7.2, y: 2.4, w: 5.0, h: 3.7,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 20
});


// -------------------------------------------------------------
// SLIDE 7: Interactive Web Dashboard & 1-Click Demo
// -------------------------------------------------------------
let slide7 = createBaseSlide("Web Application", "Interactive Web Dashboard & 24/7 Demo");

slide7.addShape(pres.ShapeType.roundRect, {
  x: 0.8, y: 1.6, w: 11.7, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.cyan, width: 1 }, rectRadius: 0.15
});

slide7.addText("🌟 Built for Simplicity: Anyone Can Understand & Test It in 2 Seconds", {
  x: 1.1, y: 1.9, w: 11.1, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.cyan
});

const dashFeatures = [
  { text: "• ⚡ 1-Click Auto Demo Button:", options: { bold: true, break: true } },
  { text: "  Generates code on ESP32, auto-fills login, and verifies on AWS Lambda automatically.\n\n" },
  { text: "• 📟 Photorealistic OLED Emulator:", options: { bold: true, break: true } },
  { text: "  128x64 canvas with pixelated scanlines, animated 30s countdown bar, and audio synthesis.\n\n" },
  { text: "• 🛡️ Built-in Replay Attack Demonstration:", options: { bold: true, break: true } },
  { text: "  Tests submitting an already used code to showcase AWS security in real time.\n\n" },
  { text: "• 🔬 Expandable Deep-Dive Inspector Tabs:", options: { bold: true, break: true } },
  { text: "  Live MQTT stream, RFC 6238 HMAC-SHA1 step visualizer, UART serial monitor, and latency graph." }
];

slide7.addText(dashFeatures, {
  x: 1.1, y: 2.4, w: 11.1, h: 3.7,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 18
});


// -------------------------------------------------------------
// SLIDE 8: AWS Learner Lab Permanent Connection
// -------------------------------------------------------------
let slide8 = createBaseSlide("Cloud Deployment", "AWS Learner Lab: Permanent 24/7 Connection");

slide8.addShape(pres.ShapeType.roundRect, {
  x: 0.8, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.amber, width: 1.5 }, rectRadius: 0.15
});

slide8.addText("💡 Why Learner Lab Accounts Expire", {
  x: 1.1, y: 1.9, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.amber
});

slide8.addText([
  { text: "• 4-Hour Session Timer:", options: { bold: true, break: true } },
  { text: "  CLI access keys and session tokens rotate after 4 hours.\n\n" },
  { text: "• BUT Cloud Resources DO NOT Expire:", options: { bold: true, break: true } },
  { text: "  Lambda functions and DynamoDB tables remain active in us-east-1 for the whole semester!\n\n" },
  { text: "• IAM Role Restriction:", options: { bold: true, break: true } },
  { text: "  Students cannot create IAM roles — must use built-in LabRole." }
], {
  x: 1.1, y: 2.4, w: 5.0, h: 3.7,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 20
});

slide8.addShape(pres.ShapeType.roundRect, {
  x: 6.9, y: 1.6, w: 5.6, h: 4.8,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.cyan, width: 1.5 }, rectRadius: 0.15
});

slide8.addText("🚀 How We Made It Permanently Connected", {
  x: 7.2, y: 1.9, w: 5.0, h: 0.4,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.cyan
});

slide8.addText([
  { text: "• Pre-Configured LabRole Template:", options: { bold: true, break: true } },
  { text: "  cloudformation-learner-lab.yaml uses LabRole — 0 permission errors!\n\n" },
  { text: "• Public HTTPS Lambda Function URL:", options: { bold: true, break: true } },
  { text: "  Direct CORS-enabled endpoint callable 24/7 without session tokens.\n\n" },
  { text: "• Triple-Layer Dashboard Persistence:", options: { bold: true, break: true } },
  { text: "  Saved in aws-config.json, localStorage, and URL query params.\n\n" },
  { text: "• Built-in Ping Diagnostics:", options: { bold: true, break: true } },
  { text: "  1-click 'Test Connection' pings AWS live with status and latency." }
], {
  x: 7.2, y: 2.4, w: 5.0, h: 3.7,
  fontSize: 13, fontFace: 'Arial', color: COLORS.textLight, lineSpacing: 18
});


// -------------------------------------------------------------
// SLIDE 9: Project Results & Key Achievements
// -------------------------------------------------------------
let slide9 = createBaseSlide("Results", "Key Achievements & Performance Metrics");

const metricCards = [
  { val: "38 ms", label: "Average Cloud Latency", sub: "Fast AWS Lambda + API Gateway roundtrip execution" },
  { val: "100%", label: "RFC 6238 Standard", sub: "HMAC-SHA1 with dynamic 31-bit truncation" },
  { val: "0 bytes", label: "Seed Over the Air", sub: "Master secret never transmitted across network" },
  { val: "24 / 7", label: "Public Web Access", sub: "Hosted live online with permanent cloud backend" }
];

metricCards.forEach((m, idx) => {
  const xPos = 0.8 + (idx % 2) * 5.9;
  const yPos = 1.7 + Math.floor(idx / 2) * 2.4;

  slide9.addShape(pres.ShapeType.roundRect, {
    x: xPos, y: yPos, w: 5.6, h: 2.1,
    fill: { color: COLORS.cardBg }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.15
  });

  slide9.addText(m.val, {
    x: xPos + 0.4, y: yPos + 0.2, w: 4.8, h: 0.6,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.cyan
  });

  slide9.addText(m.label, {
    x: xPos + 0.4, y: yPos + 0.8, w: 4.8, h: 0.4,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.textWhite
  });

  slide9.addText(m.sub, {
    x: xPos + 0.4, y: yPos + 1.25, w: 4.8, h: 0.6,
    fontSize: 11, fontFace: 'Arial', color: COLORS.textMuted
  });
});


// -------------------------------------------------------------
// SLIDE 10: Conclusion & Presentation Demo
// -------------------------------------------------------------
let slide10 = pres.addSlide();
slide10.background = { color: COLORS.bgDark };

slide10.addText("THANK YOU!", {
  x: 0.8, y: 1.5, w: 11.7, h: 0.9,
  fontSize: 40, fontFace: 'Arial', bold: true, color: COLORS.cyan, align: 'center'
});

slide10.addText("MFA Physical Token Simulator • Cloud Computing Product #2", {
  x: 0.8, y: 2.5, w: 11.7, h: 0.5,
  fontSize: 18, fontFace: 'Arial', color: COLORS.textWhite, align: 'center'
});

slide10.addShape(pres.ShapeType.roundRect, {
  x: 2.0, y: 3.3, w: 9.3, h: 2.3,
  fill: { color: COLORS.cardBg }, line: { color: COLORS.green, width: 1.5 }, rectRadius: 0.15
});

slide10.addText("🌐 Live 24/7 Public Interactive Demo:", {
  x: 2.3, y: 3.6, w: 8.7, h: 0.4,
  fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.green, align: 'center'
});

slide10.addText("https://2503a52753-purna.github.io/MFA-Physical-Token-Simulator/", {
  x: 2.3, y: 4.1, w: 8.7, h: 0.5,
  fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.cyan, align: 'center'
});

slide10.addText("Ready for Live Demonstration & Questions!", {
  x: 2.3, y: 4.7, w: 8.7, h: 0.4,
  fontSize: 12, fontFace: 'Arial', italic: true, color: COLORS.textMuted, align: 'center'
});

// Save PPTX
const outputPath = "MFA_Physical_Token_Simulator_Presentation.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("Successfully generated PowerPoint presentation:", outputPath);
}).catch(err => {
  console.error("Error generating presentation:", err);
});
