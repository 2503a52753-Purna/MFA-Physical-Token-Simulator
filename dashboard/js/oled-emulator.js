/**
 * oled-emulator.js - High-Fidelity SSD1306 128x64 OLED Screen Canvas Renderer
 * Simulates physical 0.96" Monochrome I2C OLED display on ESP32
 * Author: Purna Chandar Reddy
 */

class OledEmulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('OLED canvas element not found:', canvasId);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.width = 128;
    this.height = 64;

    // Internal state
    this.deviceId = 'ESP32-MFA-01';
    this.otp = '------';
    this.remainingSeconds = 30;
    this.totalSeconds = 30;
    this.isWifiConnected = true;
    this.isCloudConnected = true;
    this.splashMode = null; // { title, subtitle, expireAt }

    // Colors
    this.COLOR_BG = '#040d12';
    this.COLOR_CYAN = '#00f3ff';
    this.COLOR_DIM = 'rgba(0, 243, 255, 0.25)';

    this.render();
  }

  setCloudStatus(wifi, cloud) {
    this.isWifiConnected = wifi;
    this.isCloudConnected = cloud;
    this.render();
  }

  updateOtp(otp, remainingSeconds = 30) {
    this.otp = otp;
    this.remainingSeconds = remainingSeconds;
    this.render();
  }

  showSplash(title, subtitle, durationMs = 3500) {
    this.splashMode = {
      title,
      subtitle,
      expireAt: Date.now() + durationMs
    };
    this.render();

    setTimeout(() => {
      if (this.splashMode && Date.now() >= this.splashMode.expireAt) {
        this.splashMode = null;
        this.render();
      }
    }, durationMs + 50);
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    // Check if splash screen is expired
    if (this.splashMode && Date.now() >= this.splashMode.expireAt) {
      this.splashMode = null;
    }

    // Clear background
    ctx.fillStyle = this.COLOR_BG;
    ctx.fillRect(0, 0, this.width, this.height);

    // If splash active, draw modal message
    if (this.splashMode) {
      this.renderSplash(this.splashMode.title, this.splashMode.subtitle);
      return;
    }

    // 1. Top Status Bar
    ctx.font = '8px monospace';
    ctx.fillStyle = this.COLOR_CYAN;
    ctx.textBaseline = 'top';
    ctx.fillText(this.deviceId, 2, 2);

    // Wi-Fi & Cloud Icons
    let statusText = '';
    if (this.isCloudConnected) {
      statusText = '[AWS]';
    } else if (this.isWifiConnected) {
      statusText = '[WFI]';
    } else {
      statusText = '[OFF]';
    }
    const statusWidth = ctx.measureText(statusText).width;
    ctx.fillText(statusText, this.width - statusWidth - 2, 2);

    // Separator line
    ctx.strokeStyle = this.COLOR_CYAN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(this.width, 12);
    ctx.stroke();

    // 2. Subtitle: "MFA TOKEN"
    ctx.font = '7px monospace';
    ctx.fillStyle = this.COLOR_CYAN;
    const sub = 'MFA TOKEN';
    const subW = ctx.measureText(sub).width;
    ctx.fillText(sub, (this.width - subW) / 2, 16);

    // 3. OTP Value (Large 6 Digits with space)
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = this.COLOR_CYAN;
    const formattedOtp = this.otp.length === 6 ? `${this.otp.slice(0, 3)} ${this.otp.slice(3)}` : this.otp;
    const otpW = ctx.measureText(formattedOtp).width;
    ctx.fillText(formattedOtp, (this.width - otpW) / 2, 27);

    // 4. Progress / Countdown Bar
    const barX = 14;
    const barY = 48;
    const barW = 88;
    const barH = 7;

    // Background track outline
    ctx.strokeStyle = this.COLOR_CYAN;
    ctx.strokeRect(barX, barY, barW, barH);

    // Filled progress
    const progress = Math.max(0, Math.min(1, this.remainingSeconds / this.totalSeconds));
    const fillW = Math.max(0, Math.floor(progress * (barW - 2)));
    ctx.fillStyle = this.COLOR_CYAN;
    ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);

    // Remaining seconds counter
    ctx.font = '8px monospace';
    const secStr = String(this.remainingSeconds).padStart(2, '0') + 's';
    ctx.fillText(secStr, barX + barW + 5, barY);
  }

  renderSplash(title, subtitle) {
    const ctx = this.ctx;

    // Double border outline
    ctx.strokeStyle = this.COLOR_CYAN;
    ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
    ctx.strokeRect(3, 3, this.width - 6, this.height - 6);

    // Title
    ctx.font = '7px monospace';
    ctx.fillStyle = this.COLOR_CYAN;
    const tW = ctx.measureText(title).width;
    ctx.fillText(title, (this.width - tW) / 2, 8);

    // Big central badge
    ctx.font = 'bold 13px monospace';
    const isOk = subtitle.includes('GRANTED') || subtitle.includes('OK');
    const badge = isOk ? '[ ACCESS OK ]' : '[ ACCESS DENIED ]';
    const bW = ctx.measureText(badge).width;
    ctx.fillText(badge, (this.width - bW) / 2, 25);

    // Subtitle / message
    ctx.font = '7px monospace';
    const sW = ctx.measureText(subtitle).width;
    ctx.fillText(subtitle, (this.width - sW) / 2, 46);
  }
}

window.OledEmulator = OledEmulator;
