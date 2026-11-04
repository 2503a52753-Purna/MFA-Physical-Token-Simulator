/**
 * ==============================================================================
 * Project: MFA Physical Token Simulator (Cloud Computing Product #2)
 * Hardware: ESP32 + SSD1306 0.96" I2C OLED (128x64) + Push Button
 * Cloud: AWS IoT Core (MQTTS TLS 1.2) + AWS Lambda Verification
 * Author: Purna Chandar Reddy
 * ==============================================================================
 */

#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <time.h>
#include "mbedtls/md.h"

#include "config.h"
#if __has_include("secrets.h")
  #include "secrets.h"
#else
  // Fallback placeholder credentials if secrets.h not yet created
  const char WIFI_SSID[] = "Wokwi-GUEST";
  const char WIFI_PASSWORD[] = "";
  const char AWS_IOT_ENDPOINT[] = "a1b2c3d4e5f6g7-ats.iot.us-east-1.amazonaws.com";
  const int AWS_IOT_PORT = 8883;
  static const char AWS_CERT_CA[] PROGMEM = "";
  static const char AWS_CERT_CRT[] PROGMEM = "";
  static const char AWS_CERT_PRIVATE[] PROGMEM = "";
#endif

// --- Display Object ---
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- Networking & MQTT Objects ---
WiFiClientSecure netClient;
PubSubClient mqttClient(netClient);

// --- Token State Variables ---
char currentOtp[7] = "------";
unsigned long lastOtpGenerationTime = 0;
uint32_t tokenCounter = 0;
bool isCloudConnected = false;
bool isWifiConnected = false;
String lastAuthStatus = "STANDBY";
unsigned long authStatusDisplayTimer = 0;

// Button debounce state
int lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

// --- Function Prototypes ---
void initDisplay();
void connectWifi();
void connectAwsIot();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void generateNewOtp();
String computeTotp(const char* key, uint64_t step);
void updateOledUI(int remainingSeconds);
void showAckSplash(bool success, String message);

// Base32 decoder table for RFC 6238
int base32Decode(const char* encoded, uint8_t* result) {
  int buffer = 0;
  int bitsLeft = 0;
  int count = 0;
  for (int i = 0; encoded[i] != '\0'; i++) {
    char ch = toupper(encoded[i]);
    int val = -1;
    if (ch >= 'A' && ch <= 'Z') val = ch - 'A';
    else if (ch >= '2' && ch <= '7') val = ch - '2' + 26;
    if (val < 0) continue;

    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      result[count++] = (buffer >> (bitsLeft - 8)) & 0xFF;
      bitsLeft -= 8;
    }
  }
  return count;
}

// Compute 6-digit TOTP (HMAC-SHA1) based on RFC 6238
String computeTotp(const char* base32Key, uint64_t step) {
  uint8_t keyBytes[64];
  int keyLen = base32Decode(base32Key, keyBytes);

  // Big-endian 8-byte step
  uint8_t timeBytes[8];
  for (int i = 7; i >= 0; i--) {
    timeBytes[i] = step & 0xFF;
    step >>= 8;
  }

  uint8_t hmacResult[20];
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA1), 1);
  mbedtls_md_hmac_starts(&ctx, keyBytes, keyLen);
  mbedtls_md_hmac_update(&ctx, timeBytes, 8);
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  // Dynamic Truncation
  int offset = hmacResult[19] & 0x0F;
  uint32_t binary = ((hmacResult[offset] & 0x7F) << 24) |
                    ((hmacResult[offset + 1] & 0xFF) << 16) |
                    ((hmacResult[offset + 2] & 0xFF) << 8) |
                    (hmacResult[offset + 3] & 0xFF);

  uint32_t otpVal = binary % 1000000;
  char buf[7];
  snprintf(buf, sizeof(buf), "%06u", otpVal);
  return String(buf);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[SYSTEM] ========================================");
  Serial.println("[SYSTEM] ESP32 MFA Physical Token Simulator Boot");
  Serial.println("[SYSTEM] Cloud Computing 2nd Product");
  Serial.println("[SYSTEM] ========================================");

  // Initialize GPIOs
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize OLED Display
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  initDisplay();

  // Show Boot Screen
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(14, 10);
  display.println("MFA TOKEN SIMULATOR");
  display.setCursor(22, 28);
  display.println("Connecting Wi-Fi...");
  display.drawRect(14, 45, 100, 8, SSD1306_WHITE);
  display.fillRect(16, 47, 30, 4, SSD1306_WHITE);
  display.display();

  // Connect to Wi-Fi
  connectWifi();

  // Configure NTP
  if (isWifiConnected) {
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER_1, NTP_SERVER_2);
    Serial.println("[NTP] Synchronizing time with pool.ntp.org...");
    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 5000)) {
      Serial.println("[NTP] Time synchronized successfully!");
    } else {
      Serial.println("[NTP] Warning: Time sync timed out, using fallback epoch timer.");
    }
  }

  // Setup AWS IoT TLS
  if (strlen(AWS_CERT_CA) > 50) {
    netClient.setCACert(AWS_CERT_CA);
    netClient.setCertificate(AWS_CERT_CRT);
    netClient.setPrivateKey(AWS_CERT_PRIVATE);
    mqttClient.setServer(AWS_IOT_ENDPOINT, AWS_IOT_PORT);
    mqttClient.setCallback(mqttCallback);
    connectAwsIot();
  } else {
    Serial.println("[AWS] Certificate template active - running in local simulation mode.");
  }

  // Generate initial OTP on startup
  generateNewOtp();
}

void loop() {
  // Check AWS MQTT connection
  if (isWifiConnected && strlen(AWS_CERT_CA) > 50) {
    if (!mqttClient.connected()) {
      isCloudConnected = false;
      connectAwsIot();
    } else {
      mqttClient.loop();
      isCloudConnected = true;
    }
  }

  // Button Read with Debounce
  int reading = digitalRead(BUTTON_PIN);
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading == LOW && lastButtonState == HIGH) {
      Serial.println("\n[HARDWARE] Button Pressed -> Manual OTP Generation Requested!");
      digitalWrite(STATUS_LED_PIN, HIGH);
      generateNewOtp();
      digitalWrite(STATUS_LED_PIN, LOW);
    }
  }
  lastButtonState = reading;

  // Auto-refresh OTP every 30 seconds (RFC 6238 standard)
  unsigned long elapsed = millis() - lastOtpGenerationTime;
  if (elapsed >= (TOKEN_TIME_STEP * 1000)) {
    Serial.println("[TIMER] 30s Window Expired -> Refreshing OTP automatically.");
    generateNewOtp();
    elapsed = 0;
  }

  // Calculate remaining seconds in current window
  int remainingSeconds = TOKEN_TIME_STEP - (elapsed / 1000);
  if (remainingSeconds < 0) remainingSeconds = 0;

  // Render UI
  if (millis() > authStatusDisplayTimer) {
    updateOledUI(remainingSeconds);
  }

  delay(100);
}

void generateNewOtp() {
  tokenCounter++;
  time_t now = time(nullptr);
  uint64_t step;

  if (now > 100000) {
    step = now / TOKEN_TIME_STEP;
  } else {
    // If NTP not available, use internal millis() counter
    step = (millis() / 1000) / TOKEN_TIME_STEP;
  }

  String generated = computeTotp(DEFAULT_SHARED_SECRET, step);
  generated.toCharArray(currentOtp, sizeof(currentOtp));
  lastOtpGenerationTime = millis();

  Serial.printf("[OTP] Token: %s | Counter: %u | Step: %llu\n", currentOtp, tokenCounter, step);

  // Publish to AWS IoT Core
  if (mqttClient.connected()) {
    char payload[256];
    snprintf(payload, sizeof(payload),
      "{\"deviceId\":\"%s\",\"otp\":\"%s\",\"counter\":%u,\"timestamp\":%ld,\"event\":\"OTP_GENERATED\"}",
      DEVICE_ID, currentOtp, tokenCounter, (long)now);

    mqttClient.publish(AWS_IOT_PUB_TOPIC, payload);
    Serial.printf("[AWS-MQTT] Published to %s: %s\n", AWS_IOT_PUB_TOPIC, payload);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[256];
  if (length >= sizeof(message)) length = sizeof(message) - 1;
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("[AWS-MQTT] Message arrived on [%s]: %s\n", topic, message);

  // Check if verification ack arrived from AWS Lambda
  if (strstr(message, "VERIFIED") != NULL || strstr(message, "GRANTED") != NULL) {
    lastAuthStatus = "ACCESS GRANTED";
    authStatusDisplayTimer = millis() + 3500;
    showAckSplash(true, "ACCESS GRANTED");
  } else if (strstr(message, "DENIED") != NULL || strstr(message, "FAILED") != NULL) {
    lastAuthStatus = "ACCESS DENIED";
    authStatusDisplayTimer = millis() + 3500;
    showAckSplash(false, "ACCESS DENIED");
  }
}

void showAckSplash(bool success, String message) {
  display.clearDisplay();
  display.drawRect(0, 0, 128, 64, SSD1306_WHITE);
  display.drawRect(2, 2, 124, 60, SSD1306_WHITE);

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(20, 10);
  display.println("AWS VERIFICATION");

  display.setCursor(success ? 22 : 25, 28);
  display.setTextSize(2);
  display.println(success ? "[ OK ]" : "[FAIL]");

  display.setTextSize(1);
  display.setCursor(18, 48);
  display.println(message);
  display.display();
}

void updateOledUI(int remainingSeconds) {
  display.clearDisplay();

  // Top Status Bar
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(2, 2);
  display.print(DEVICE_ID);

  // Cloud & Wifi Icons
  display.setCursor(92, 2);
  if (isCloudConnected) {
    display.print("[AWS]");
  } else if (isWifiConnected) {
    display.print("[WFI]");
  } else {
    display.print("[SIM]");
  }

  // Horizontal Separator
  display.drawLine(0, 12, 128, 12, SSD1306_WHITE);

  // Label
  display.setCursor(34, 16);
  display.print("MFA TOKEN");

  // Big 6-digit OTP Display
  display.setTextSize(2);
  display.setCursor(18, 28);
  // Add space between 3rd and 4th digits for visual readability
  char formatted[8];
  snprintf(formatted, sizeof(formatted), "%.3s %.3s", currentOtp, currentOtp + 3);
  display.print(formatted);

  // Bottom Progress / Countdown Bar
  int barWidth = map(remainingSeconds, 0, TOKEN_TIME_STEP, 0, 100);
  display.drawRect(14, 50, 100, 6, SSD1306_WHITE);
  display.fillRect(14, 50, barWidth, 6, SSD1306_WHITE);

  // Remaining Seconds Display
  display.setTextSize(1);
  display.setCursor(118, 49);
  display.print(remainingSeconds);

  display.display();
}

void initDisplay() {
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("[ERROR] SSD1306 OLED allocation failed! Checking alternate address 0x3D...");
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
      Serial.println("[ERROR] OLED display not found! Running headless mode.");
      return;
    }
  }
  display.clearDisplay();
  display.display();
}

void connectWifi() {
  if (strlen(WIFI_SSID) == 0 || strcmp(WIFI_SSID, "YOUR_WIFI_SSID") == 0) {
    Serial.println("[WIFI] Wi-Fi credentials not configured. Running in offline/simulation mode.");
    isWifiConnected = false;
    return;
  }

  Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isWifiConnected = true;
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
  } else {
    isWifiConnected = false;
    Serial.println("\n[WIFI] Connection failed. Running in standalone hardware mode.");
  }
}

void connectAwsIot() {
  if (!isWifiConnected || strlen(AWS_CERT_CA) < 50) return;

  Serial.println("[AWS] Connecting to AWS IoT Core...");
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 3) {
    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println("[AWS] Connected to AWS IoT Core successfully!");
      isCloudConnected = true;
      mqttClient.subscribe(AWS_IOT_SUB_TOPIC);
      Serial.printf("[AWS] Subscribed to topic: %s\n", AWS_IOT_SUB_TOPIC);
      break;
    } else {
      Serial.printf("[AWS] Connection failed, rc=%d. Retrying in 2 seconds...\n", mqttClient.state());
      delay(2000);
      attempts++;
    }
  }
}
