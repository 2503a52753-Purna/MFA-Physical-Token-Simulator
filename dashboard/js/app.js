/**
 * app.js - Main Application Controller for MFA Physical Token Simulator
 * Author: Purna Chandar Reddy
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Core Subsystems
  const totp = new TotpEngine('JBSWY3DPEHPK3PXP', 30, 6);
  const oled = new OledEmulator('oledCanvas');
  const aws = new AwsClient();
  const ui = new UiComponents();

  let autoRefreshEnabled = true;
  let currentTokenData = null;
  let chartInstance = null;

  // DOM Elements
  const btnGenerateOtp = document.getElementById('btn-generate-otp');
  const btnVerifyOtp = document.getElementById('btn-verify-otp');
  const inputOtp = document.getElementById('input-otp');
  const btnCopyOtp = document.getElementById('btn-copy-otp');
  const btnClearConsole = document.getElementById('btn-clear-console');
  const toggleAutoRefresh = document.getElementById('toggle-auto-refresh');

  // LEDs
  const ledPwr = document.getElementById('led-pwr');
  const ledWifi = document.getElementById('led-wifi');
  const ledTx = document.getElementById('led-tx');
  const ledAuth = document.getElementById('led-auth');

  // Stats
  const statGenerated = document.getElementById('stat-generated');
  const statVerified = document.getElementById('stat-verified');
  const statFailed = document.getElementById('stat-failed');
  const statLatency = document.getElementById('stat-latency');

  // Crypto breakdown elements
  const cryptoSecret = document.getElementById('crypto-secret');
  const cryptoTimestamp = document.getElementById('crypto-timestamp');
  const cryptoStep = document.getElementById('crypto-step');
  const cryptoHmac = document.getElementById('crypto-hmac');
  const cryptoTruncation = document.getElementById('crypto-truncation');
  const cryptoOtp = document.getElementById('crypto-otp');

  // Settings Modal elements
  const modalSettings = document.getElementById('modal-settings');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const formSettings = document.getElementById('form-settings');
  const settingApiEndpoint = document.getElementById('setting-api-endpoint');
  const settingIotEndpoint = document.getElementById('setting-iot-endpoint');
  const settingSecret = document.getElementById('setting-secret');
  const settingRegion = document.getElementById('setting-region');
  const statusCloudMode = document.getElementById('status-cloud-mode');

  // Initial Serial Monitor logs
  ui.appendSerialLog('[ESP32] Hardware boot sequence initialized (DevKit-C v4)', 'info');
  ui.appendSerialLog('[I2C] SSD1306 OLED display detected at 0x3C (128x64)', 'success');
  ui.appendSerialLog('[WIFI] Connected to AP (IP: 192.168.1.104, RSSI: -48dBm)', 'success');
  ui.appendSerialLog('[NTP] Synced epoch with pool.ntp.org', 'info');
  ui.appendSerialLog('[AWS-IOT] TLS 1.2 handshake OK -> Connected to endpoint', 'mqtt');

  // Populate settings modal values
  if (settingApiEndpoint) settingApiEndpoint.value = aws.apiEndpoint;
  if (settingIotEndpoint) settingIotEndpoint.value = aws.iotEndpoint;
  if (settingSecret) settingSecret.value = totp.secret;
  if (settingRegion) settingRegion.value = aws.region;
  updateCloudModeBadge();

  // Function to refresh OTP token
  async function refreshOtp(isManualTrigger = false) {
    if (isManualTrigger) {
      ui.playClickSound();
      blinkLed(ledTx, 'led-amber-active', 250);
      ui.appendSerialLog('[GPIO] Button PIN 4 triggered (FALLING EDGE)', 'warn');
    }

    const tokenData = await totp.generateToken();
    currentTokenData = tokenData;
    aws.stats.generatedCount++;
    if (statGenerated) statGenerated.textContent = aws.stats.generatedCount;

    // Update OLED
    const remaining = totp.getRemainingSeconds();
    oled.updateOtp(tokenData.token, remaining);

    // Update Crypto Inspector
    updateCryptoInspector(tokenData);

    // Record MQTT telemetry
    const epoch = Math.floor(Date.now() / 1000);
    aws.recordMqttMessage('mfa/devices/ESP32-MFA-01/otp', {
      deviceId: 'ESP32-MFA-01',
      otp: tokenData.token,
      counter: tokenData.step,
      timestamp: epoch,
      event: isManualTrigger ? 'BUTTON_PUSHED' : 'WINDOW_CYCLE'
    }, 'TX');

    ui.appendSerialLog(`[CRYPTO] HMAC-SHA1 step=${tokenData.step} -> OTP=${tokenData.token}`, 'crypto');
    ui.appendSerialLog(`[AWS-MQTT] Published to mfa/devices/ESP32-MFA-01/otp`, 'mqtt');
    renderMqttStream();
  }

  // Update Cryptographic Step-by-Step Inspector
  function updateCryptoInspector(data) {
    if (!data) return;
    const epoch = Math.floor(Date.now() / 1000);
    if (cryptoSecret) cryptoSecret.textContent = data.secret;
    if (cryptoTimestamp) cryptoTimestamp.textContent = `${epoch} (UTC)`;
    if (cryptoStep) cryptoStep.textContent = `floor(${epoch} / 30) = ${data.step}`;
    if (cryptoHmac) cryptoHmac.textContent = data.hashHex;
    if (cryptoTruncation) cryptoTruncation.textContent = `Offset: ${data.offset} | Dynamic 31-bit integer: 0x${data.binary.toString(16).toUpperCase()}`;
    if (cryptoOtp) cryptoOtp.textContent = data.token;
  }

  // Blink LED helper
  function blinkLed(element, activeClass, durationMs = 300) {
    if (!element) return;
    element.classList.remove('led-off');
    element.classList.add(activeClass);
    setTimeout(() => {
      element.classList.remove(activeClass);
      element.classList.add('led-off');
    }, durationMs);
  }

  // Render Live MQTT Stream in Telemetry Card
  function renderMqttStream() {
    const streamContainer = document.getElementById('mqtt-packet-stream');
    if (!streamContainer) return;

    streamContainer.innerHTML = '';
    aws.mqttStream.slice(0, 8).forEach(pkt => {
      const item = document.createElement('div');
      item.className = 'p-2 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono-code flex flex-col gap-1';

      const isTx = pkt.direction === 'TX';
      const dirBadge = isTx
        ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">ESP32 ➔ AWS</span>'
        : '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AWS ➔ ESP32</span>';

      item.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">${dirBadge} <span class="text-slate-400 font-bold">${pkt.topic}</span></div>
          <span class="text-slate-500 text-[10px]">${pkt.timestamp}</span>
        </div>
        <pre class="text-slate-300 text-[11px] overflow-x-auto bg-slate-950/60 p-1.5 rounded">${JSON.stringify(pkt.payload, null, 2)}</pre>
      `;
      streamContainer.appendChild(item);
    });
  }

  // Update Status Badges
  function updateCloudModeBadge() {
    if (!statusCloudMode) return;
    if (aws.mode === 'live') {
      statusCloudMode.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5';
      statusCloudMode.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> AWS Live Cloud (${aws.region})`;
    } else {
      statusCloudMode.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center gap-1.5';
      statusCloudMode.innerHTML = `<span class="w-2 h-2 rounded-full bg-sky-400"></span> AWS Lambda Simulator (${aws.region})`;
    }
  }

  // Initialize Latency & Request History Chart
  function initChart() {
    const canvas = document.getElementById('chart-telemetry');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Boot', 'Init', 'T-4', 'T-3', 'T-2', 'T-1', 'Now'],
        datasets: [{
          label: 'Lambda Latency (ms)',
          data: [45, 52, 48, 62, 41, 44, 42],
          borderColor: '#00f3ff',
          backgroundColor: 'rgba(0, 243, 255, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#00f3ff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } },
            suggestedMin: 20,
            suggestedMax: 100
          }
        }
      }
    });
  }

  // Update Chart with new latency
  function recordChartLatency(latency) {
    if (!chartInstance) return;
    const labels = chartInstance.data.labels;
    const data = chartInstance.data.datasets[0].data;

    labels.shift();
    labels.push(new Date().toLocaleTimeString().slice(3));

    data.shift();
    data.push(latency);

    chartInstance.update();
  }

  // Countdown Loop (updates remaining seconds and auto-generates OTP every 30s)
  setInterval(() => {
    const remaining = totp.getRemainingSeconds();
    if (currentTokenData) {
      oled.updateOtp(currentTokenData.token, remaining);
    }

    // Refresh OTP when 30-second window completes
    if (remaining === 30 && autoRefreshEnabled) {
      refreshOtp(false);
    }
  }, 1000);

  // Event Listeners
  if (btnGenerateOtp) {
    btnGenerateOtp.addEventListener('click', () => {
      refreshOtp(true);
    });
  }

  if (toggleAutoRefresh) {
    toggleAutoRefresh.addEventListener('change', (e) => {
      autoRefreshEnabled = e.target.checked;
      ui.showToast(autoRefreshEnabled ? 'Auto 30s OTP refresh enabled' : 'Auto refresh disabled (Manual trigger only)', 'info');
    });
  }

  if (btnCopyOtp) {
    btnCopyOtp.addEventListener('click', () => {
      if (currentTokenData && inputOtp) {
        inputOtp.value = currentTokenData.token;
        ui.showToast(`Copied ${currentTokenData.token} to Verification Input!`, 'success');
        inputOtp.focus();
      }
    });
  }

  if (btnClearConsole) {
    btnClearConsole.addEventListener('click', () => {
      const monitor = document.getElementById('serial-monitor-log');
      if (monitor) monitor.innerHTML = '';
      ui.showToast('Serial console cleared', 'info');
    });
  }

  // MFA Verification Form Submission
  if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', async (e) => {
      e.preventDefault();
      const code = inputOtp ? inputOtp.value.trim() : '';

      if (!code || code.length !== 6) {
        ui.showToast('Please enter a 6-digit OTP code', 'warning');
        return;
      }

      btnVerifyOtp.disabled = true;
      btnVerifyOtp.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Verifying with AWS Lambda...`;

      ui.appendSerialLog(`[API-GATEWAY] POST /verify { otp: "${code}", deviceId: "ESP32-MFA-01" }`, 'info');

      try {
        const result = await aws.verifyOtp({
          deviceId: 'ESP32-MFA-01',
          otp: code,
          userId: 'admin@cloudenterprise.io',
          totpEngine: totp
        });

        // Update Stats & Latency
        if (statVerified) statVerified.textContent = aws.stats.verifiedCount;
        if (statFailed) statFailed.textContent = aws.stats.failedCount;
        if (statLatency) statLatency.textContent = `${aws.getAverageLatency()}ms`;
        recordChartLatency(result.latencyMs);

        const resultBanner = document.getElementById('verification-result-banner');

        if (result.verified) {
          ui.playSuccessSound();
          blinkLed(ledAuth, 'led-green-active', 2000);
          oled.showSplash('AWS VERIFICATION', 'ACCESS GRANTED');
          ui.appendSerialLog(`[AWS-LAMBDA] Verification SUCCESS (Latency: ${result.latencyMs}ms)`, 'success');
          ui.appendSerialLog(`[SESSION] Token issued: ${result.sessionToken.slice(0, 16)}...`, 'info');

          if (resultBanner) {
            resultBanner.className = 'p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-200 flex flex-col gap-2 mt-4';
            resultBanner.innerHTML = `
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold text-emerald-400">
                  <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                  ACCESS GRANTED - MFA Verified
                </div>
                <span class="text-xs font-mono-code px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300">${result.latencyMs}ms</span>
              </div>
              <p class="text-xs text-slate-300">AWS Lambda verified the token against the device seed with drift tolerance. Session authenticated.</p>
              <div class="text-[11px] font-mono-code text-slate-400 bg-black/40 p-2 rounded">Session Token: ${result.sessionToken}</div>
            `;
          }
          ui.showToast('Authentication Successful!', 'success');
        } else {
          ui.playErrorSound();
          blinkLed(ledAuth, 'led-red-active', 1500);
          oled.showSplash('AWS VERIFICATION', 'ACCESS DENIED');

          const isReplay = result.error === 'REPLAY_ATTACK_DETECTED';
          ui.appendSerialLog(`[AWS-LAMBDA] Verification FAILED: ${result.error}`, 'error');

          if (resultBanner) {
            resultBanner.className = 'p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 flex flex-col gap-2 mt-4';
            resultBanner.innerHTML = `
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold text-rose-400">
                  <svg class="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.416 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                  ${isReplay ? 'REPLAY ATTACK PREVENTED' : 'VERIFICATION FAILED'}
                </div>
                <span class="text-xs font-mono-code px-2 py-0.5 rounded bg-rose-900/60 text-rose-300">${result.latencyMs}ms</span>
              </div>
              <p class="text-xs text-slate-300">${result.message || 'The OTP entered is either expired or did not match the device cryptographic sequence.'}</p>
            `;
          }
          ui.showToast(isReplay ? 'Replay attack prevented!' : 'Invalid or expired OTP', 'error');
        }

        renderMqttStream();
      } catch (err) {
        ui.showToast('Verification request error: ' + err.message, 'error');
      } finally {
        btnVerifyOtp.disabled = false;
        btnVerifyOtp.innerHTML = `
          <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          Verify with AWS Lambda
        `;
      }
    });
  }

  // Settings Modal Handlers
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      modalSettings.classList.remove('hidden');
    });
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      modalSettings.classList.add('hidden');
    });
  }

  if (formSettings) {
    formSettings.addEventListener('submit', (e) => {
      e.preventDefault();
      const newApi = settingApiEndpoint.value.trim();
      const newIot = settingIotEndpoint.value.trim();
      const newSecret = settingSecret.value.trim() || 'JBSWY3DPEHPK3PXP';
      const newRegion = settingRegion.value.trim() || 'us-east-1';

      aws.setEndpoints(newRegion, newApi, newIot);
      totp.setSecret(newSecret);

      updateCloudModeBadge();
      modalSettings.classList.add('hidden');
      ui.showToast('Configuration updated successfully!', 'success');
      ui.appendSerialLog(`[CONFIG] Updated AWS Endpoint: ${newApi || 'Simulated Mode'}`, 'info');
      refreshOtp(false);
    });
  }

  // Boot initial state
  await refreshOtp(false);
  initChart();
});
