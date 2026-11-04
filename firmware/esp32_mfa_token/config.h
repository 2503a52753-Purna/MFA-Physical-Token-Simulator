/**
 * config.h - Configuration & Pin Definitions for MFA Physical Token
 * Project: MFA Physical Token Simulator (Cloud Computing Product #2)
 * Author: Purna Chandar Reddy
 */

#ifndef CONFIG_H
#define CONFIG_H

// --- Hardware Pin Definitions ---
#define BUTTON_PIN        4     // Tactile Push Button GPIO (Active LOW with internal PULLUP)
#define I2C_SDA_PIN       21    // SSD1306 OLED SDA
#define I2C_SCL_PIN       22    // SSD1306 OLED SCL
#define STATUS_LED_PIN    2     // On-board Blue Status LED (indicates sync/verification)

// --- OLED Display Configuration ---
#define SCREEN_WIDTH      128   // OLED display width in pixels
#define SCREEN_HEIGHT     64    // OLED display height in pixels
#define OLED_RESET        -1    // Reset pin (-1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS    0x3C  // I2C 7-bit Address for SSD1306 128x64 display

// --- Token & Cryptographic Parameters ---
#define TOKEN_TIME_STEP   30    // TOTP interval window in seconds (RFC 6238 standard)
#define OTP_LENGTH        6     // Number of digits for OTP
#define DEVICE_ID         "ESP32-MFA-01"  // Unique Hardware Token Identifier

// Default Shared Secret Key (Base32 format: "JBSWY3DPEHPK3PXP" -> standard test seed)
// In production, this is provisioned into encrypted NVS flash during factory setup
#define DEFAULT_SHARED_SECRET "JBSWY3DPEHPK3PXP"

// --- AWS IoT MQTT Topics ---
#define AWS_IOT_PUB_TOPIC "mfa/devices/ESP32-MFA-01/otp"
#define AWS_IOT_SUB_TOPIC "mfa/devices/ESP32-MFA-01/ack"

// --- NTP Time Server ---
#define NTP_SERVER_1      "pool.ntp.org"
#define NTP_SERVER_2      "time.nist.gov"
#define GMT_OFFSET_SEC    19800 // IST (UTC +5:30) = 19800 seconds (or 0 for UTC)
#define DAYLIGHT_OFFSET_SEC 0

#endif // CONFIG_H
