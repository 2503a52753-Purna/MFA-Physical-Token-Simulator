# Circuit Wiring & Hardware Pinout Guide

This guide details the hardware assembly and wiring connections for the **MFA Physical Token Simulator** using an ESP32 microcontroller, a 0.96-inch monochrome I2C OLED display, and a tactile push button.

---

## 1. Bill of Materials (BOM)

| Component | Specification | Quantity | Purpose |
| :--- | :--- | :---: | :--- |
| **ESP32 DevKit** | ESP32-WROOM-32 (30 or 38 pins) | 1 | Microcontroller with Wi-Fi & Hardware Crypto Engine |
| **OLED Display** | 0.96" SSD1306 128x64 I2C Display | 1 | Visual output for 6-digit OTP & countdown bar |
| **Push Button** | 6x6mm Momentary Tactile Switch | 1 | Manual OTP generation trigger |
| **Breadboard & Wires** | Standard solderless breadboard + Jumper wires | 1 | Prototyping & interconnects |
| **Resistor (Optional)** | 10kΩ (External pullup, optional) | 1 | Internal ESP32 pullup on GPIO 4 is used by default |

---

## 2. Complete Wiring Table

```
           +-----------------------------+
           |       ESP32 DevKit-C        |
           |                             |
           | 3V3 ------------------------+----> OLED VCC (Red)
           | GND ------------------------+----> OLED GND (Black)
           |                             |----> Button Terminal 2 (Black)
           | GPIO 21 (SDA) --------------+----> OLED SDA (Blue)
           | GPIO 22 (SCL) --------------+----> OLED SCL (Yellow)
           | GPIO 4  --------------------+----> Button Terminal 1 (Green)
           +-----------------------------+
```

| Source (ESP32 Pin) | Target Component Pin | Wire Color | Signal Function |
| :--- | :--- | :--- | :--- |
| **3V3** | OLED **VCC** | Red | 3.3V DC Power Supply |
| **GND** | OLED **GND** | Black | Ground |
| **GPIO 21** | OLED **SDA** | Blue / Green | I2C Serial Data line |
| **GPIO 22** | OLED **SCL** | Yellow / White | I2C Serial Clock line |
| **GPIO 4** | Push Button **Leg 1** | Green | Input with internal `INPUT_PULLUP` |
| **GND** | Push Button **Leg 2** | Black | Ground reference (button press grounds GPIO 4) |
| **GPIO 2 (Onboard)** | Status LED (Built-in) | - | Blue LED blinks on OTP generation & ACK |

---

## 3. Important Assembly Tips

1. **Power Rating**:
   - The SSD1306 0.96" OLED is powered from the **3V3** pin of the ESP32. Do NOT connect it to VIN (5V) unless your specific OLED breakout board includes a 5V voltage regulator.
2. **I2C Address Verification**:
   - Most SSD1306 displays ship configured with I2C address `0x3C`.
   - If your screen does not display anything, inspect the back of the OLED PCB: some manufacturers default to `0x3D`. The firmware automatically attempts fallback to `0x3D` if `0x3C` fails.
3. **Internal Pull-Up vs External**:
   - The firmware initializes `pinMode(BUTTON_PIN, INPUT_PULLUP);`. The internal ESP32 45kΩ pull-up resistor is active, eliminating the need for an external physical pull-up resistor.
   - When unpressed: GPIO 4 reads `HIGH (1)`.
   - When pressed: GPIO 4 is shorted to GND and reads `LOW (0)`.
