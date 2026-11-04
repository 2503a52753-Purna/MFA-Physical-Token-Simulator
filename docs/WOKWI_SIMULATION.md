# Wokwi Online Simulator Guide

You can simulate the entire **MFA Physical Token Simulator** hardware in your web browser with zero physical components using **Wokwi Simulator**.

---

## 1. Quick Start (Browser-Only, No Install)

1. Open [https://wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32) in your browser.
2. In the code tab (`sketch.ino`), replace all contents with the code from:
   `firmware/esp32_mfa_token/esp32_mfa_token.ino`
3. Click the `+` button in Wokwi to add parts:
   - Add **OLED Display SSD1306** (128x64 I2C).
   - Add **Pushbutton** (tactile switch).
   - Add **LED** (blue) with a 220Ω resistor.
4. Or switch to the `diagram.json` tab in Wokwi and paste the contents of `firmware/diagram.json`.
5. Click the green **Play (Start Simulation)** button!

---

## 2. Interactive Testing in Simulation

1. **Observe Startup**:
   - The SSD1306 OLED displays the boot splash screen.
   - It initializes NTP time synchronization and generates its first 6-digit OTP code.
   - The 30-second progress bar starts decreasing smoothly.
2. **Push Button Interaction**:
   - Click the green tactile button on the Wokwi canvas.
   - The simulated UART Serial Monitor logs:
     `[HARDWARE] Button Pressed -> Manual OTP Generation Requested!`
   - A new dynamic 6-digit OTP is immediately generated and displayed on the OLED screen.
3. **Verify with Dashboard**:
   - Open `dashboard/index.html` in another browser tab.
   - Type the 6-digit OTP shown on the Wokwi OLED into the dashboard's verification terminal.
   - Click **Verify with AWS Lambda** to observe real-time cloud authentication!
