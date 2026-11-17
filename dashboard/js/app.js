/**
 * app.js - Main Application Controller for MFA Hardware Token Simulator
 * Author: Purna Chandar Reddy
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Core Subsystems
  const totp = new TotpEngine('JBSWY3DPEHPK3PXP', 30, 6);
  const oled = new OledEmulator('oledCanvas');
  const aws = new AwsClient();
  const ui = new UiComponents();

  // Load persistent configurations (URL params, localStorage, aws-config.json)
  await aws.initConfig();

  let autoRefreshEnabled = true;
  let currentTokenData = null;
  let chartInstance = null;

  // DOM Elements - Hardware & Controls
  const btnGenerateOtp = document.getElementById('btn-generate-otp');
  const btnVerifyOtp = document.getElementById('btn-verify-otp');
  const inputOtp = document.getElementById('input-otp');
  const btnAutofillOtp = document.getElementById('btn-autofill-otp');
  const btnCopyOtp = document.getElementById('btn-copy-otp');
  const toggleAutoRefresh = document.getElementById('toggle-auto-refresh');
  const countdownText = document.getElementById('countdown-text');
  const countdownBar = document.getElementById('countdown-bar');
  const oledTimerLabel = document.getElementById('oled-timer-label');

  // Quick Demo Buttons
  const btnQuickDemo = document.getElementById('btn-quick-demo');
  const btnHeaderQuickDemo = document.getElementById('btn-header-quick-demo');
  const btnQuickReplay = document.getElementById('btn-quick-replay');
  const btnTestReplayInline = document.getElementById('btn-test-replay-inline');

  // LEDs
  const ledPwr = document.getElementById('led-pwr');
  const ledWifi = document.getElementById('led-wifi');
  const ledTx = document.getElementById('led-tx');
  const ledAuth = document.getElementById('led-auth');

  // Stats Counters
  const statGenerated = document.getElementById('stat-generated');
  const statVerified = document.getElementById('stat-verified');
  const statFailed = document.getElementById('stat-failed');
  const statLatency = document.getElementById('stat-latency');

  // Cryptographic Breakdown Elements
  const cryptoSecret = document.getElementById('crypto-secret');
  const cryptoTimestamp = document.getElementById('crypto-timestamp');
  const cryptoStep = document.getElementById('crypto-step');
  const cryptoHmac = document.getElementById('crypto-hmac');
  const cryptoTruncation = document.getElementById('crypto-truncation');
  const cryptoOtp = document.getElementById('crypto-otp');

  // Status & Badges
  const btnStatusPill = document.getElementById('btn-status-pill');
  const statusPulseDot = document.getElementById('status-pulse-dot');
  const statusCloudLabel = document.getElementById('status-cloud-label');
  const terminalBadge = document.getElementById('terminal-badge');
  const verificationResultBanner = document.getElementById('verification-result-banner');

  // AWS Learner Lab Modal Elements
  const modalLearnerLab = document.getElementById('modal-learner-lab');
  const btnOpenLearnerLab = document.getElementById('btn-open-learner-lab');
  const btnCloseLearnerLab = document.getElementById('btn-close-learner-lab');
  const formLearnerLab = document.getElementById('form-learner-lab');
  const inputLearnerLabEndpoint = document.getElementById('input-learner-lab-endpoint');
  const inputLearnerLabRegion = document.getElementById('input-learner-lab-region');
  const inputLearnerLabSecret = document.getElementById('input-learner-lab-secret');
  const btnTestConnection = document.getElementById('btn-test-connection');
  const btnResetSimulator = document.getElementById('btn-reset-simulator');
  const testConnectionResult = document.getElementById('test-connection-result');
  const modalStatusDot = document.getElementById('modal-status-dot');
  const modalStatusText = document.getElementById('modal-status-text');
  const modalStatusLatency = document.getElementById('modal-status-latency');

  // Console & Tabs
  const btnClearConsole = document.getElementById('btn-clear-console');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Initial Hardware Boot Logs in Virtual Serial Console
  ui.appendSerialLog('[ESP32] Hardware boot sequence initialized (DevKit-C v4)', 'info');
  ui.appendSerialLog('[I2C] SSD1306 OLED display detected at 0x3C (128x64)', 'success');
  ui.appendSerialLog('[WIFI] Connected to AP (IP: 192.168.1.104, RSSI: -48dBm)', 'success');
  ui.appendSerialLog('[NTP] Synced epoch with pool.ntp.org (time offset: +0.02s)', 'info');
  ui.appendSerialLog(`[AWS-BACKEND] Target: ${aws.apiEndpoint ? 'Permanent AWS Learner Lab' : 'Built-in Lambda Engine'}`, 'mqtt');

  // Initialize UI with persistent AWS state
  if (inputLearnerLabEndpoint) inputLearnerLabEndpoint.value = aws.apiEndpoint;
  if (inputLearnerLabRegion) inputLearnerLabRegion.value = aws.region;
  if (inputLearnerLabSecret) inputLearnerLabSecret.value = totp.secret;
  updateCloudModeBadge();

  /**
   * Function to refresh OTP token
   */
  async function refreshOtp(isManualTrigger = false) {
    if (isManualTrigger) {
      ui.playClickSound();
      blinkLed(ledTx, 'led-amber-active', 280);
      ui.appendSerialLog('[GPIO] Button PIN 4 triggered (FALLING EDGE)', 'warn');
    }

    const tokenData = await totp.generateToken();
    currentTokenData = tokenData;
    aws.stats.generatedCount++;
    if (statGenerated) statGenerated.textContent = aws.stats.generatedCount;

    // Update OLED Canvas
    const remaining = totp.getRemainingSeconds();
    oled.updateOtp(tokenData.token, remaining);

    // Update Cryptographic Inspector
    updateCryptoInspector(tokenData);

    // Record MQTT telemetry frame
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

  /**
   * Update Cryptographic Step-by-Step Inspector
   */
  function updateCryptoInspector(data) {
    if (!data) return;
    const epoch = Math.floor(Date.now() / 1000);
    if (cryptoSecret) cryptoSecret.textContent = data.secret;
    if (cryptoTimestamp) cryptoTimestamp.textContent = `${epoch} (UTC seconds)`;
    if (cryptoStep) cryptoStep.textContent = `floor(${epoch} / 30) = ${data.step}`;
    if (cryptoHmac) cryptoHmac.textContent = data.hashHex;
    if (cryptoTruncation) cryptoTruncation.textContent = `Offset: ${data.offset} | 31-bit integer: 0x${data.binary.toString(16).toUpperCase()}`;
    if (cryptoOtp) cryptoOtp.textContent = data.token;
  }

  /**
   * Blink LED helper
   */
  function blinkLed(element, activeClass, durationMs = 300) {
    if (!element) return;
    element.classList.remove('led-off');
    element.classList.add(activeClass);
    setTimeout(() => {
      element.classList.remove(activeClass);
      element.classList.add('led-off');
    }, durationMs);
  }

  /**
   * Render Live MQTT Stream in Inspector
   */
  function renderMqttStream() {
    const streamContainer = document.getElementById('mqtt-packet-stream');
    if (!streamContainer) return;

    streamContainer.innerHTML = '';
    aws.mqttStream.slice(0, 6).forEach(pkt => {
      const item = document.createElement('div');
      item.className = 'p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-code flex flex-col gap-1';

      const isTx = pkt.direction === 'TX';
      const dirBadge = isTx
        ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">ESP32 ➔ AWS</span>'
        : '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AWS ➔ ESP32</span>';

      item.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">${dirBadge} <span class="text-slate-300 font-bold">${pkt.topic}</span></div>
          <span class="text-slate-500 text-[10px]">${pkt.timestamp}</span>
        </div>
        <pre class="text-slate-300 text-[11px] overflow-x-auto bg-black/40 p-1.5 rounded">${JSON.stringify(pkt.payload, null, 2)}</pre>
      `;
      streamContainer.appendChild(item);
    });
  }

  /**
   * Update Cloud Mode Badges and Status Displays
   */
  function updateCloudModeBadge() {
    const isLive = aws.mode === 'live' && !!aws.apiEndpoint;

    if (statusPulseDot && statusCloudLabel) {
      if (isLive) {
        statusPulseDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
        statusCloudLabel.textContent = `AWS Live (${aws.region})`;
        if (btnStatusPill) {
          btnStatusPill.className = 'px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:border-emerald-300 flex items-center gap-1.5 transition';
        }
        if (terminalBadge) {
          terminalBadge.textContent = `AWS Live Lambda • ${aws.region}`;
          terminalBadge.className = 'px-2.5 py-1 rounded bg-emerald-950 text-[11px] font-mono-code text-emerald-300 border border-emerald-800';
        }
      } else {
        statusPulseDot.className = 'w-2 h-2 rounded-full bg-sky-400';
        statusCloudLabel.textContent = 'AWS Simulator Mode';
        if (btnStatusPill) {
          btnStatusPill.className = 'px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:border-sky-400 flex items-center gap-1.5 transition';
        }
        if (terminalBadge) {
          terminalBadge.textContent = 'AWS Lambda POST /verify';
          terminalBadge.className = 'px-2.5 py-1 rounded bg-slate-800 text-[11px] font-mono-code text-cyan-400 border border-slate-700';
        }
      }
    }

    if (modalStatusDot && modalStatusText && modalStatusLatency) {
      if (isLive) {
        modalStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse';
        modalStatusText.textContent = `Permanent AWS Learner Lab Active (${aws.region})`;
        modalStatusLatency.textContent = `Latency: ${aws.lastLatency}ms`;
      } else {
        modalStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400';
        modalStatusText.textContent = 'Built-in Lambda Simulator (Offline Mode)';
        modalStatusLatency.textContent = `Latency: ${aws.lastLatency}ms`;
      }
    }
  }

  /**
   * Initialize Latency Chart
   */
  function initChart() {
    const canvas = document.getElementById('chart-telemetry');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Boot', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Now'],
        datasets: [{
          label: 'Lambda Latency (ms)',
          data: [42, 38, 45, 36, 40, 37, 38],
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
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748b', font: { size: 10 } },
            suggestedMin: 20,
            suggestedMax: 80
          }
        }
      }
    });
  }

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

  /**
   * Verify OTP logic
   */
  async function performVerification(codeToVerify) {
    const code = (codeToVerify || (inputOtp ? inputOtp.value : '')).trim();

    if (!code || code.length !== 6) {
      ui.showToast('Please enter a 6-digit OTP code', 'warning');
      if (inputOtp) inputOtp.focus();
      return;
    }

    if (btnVerifyOtp) {
      btnVerifyOtp.disabled = true;
      btnVerifyOtp.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Verifying with AWS Lambda...
      `;
    }

    ui.appendSerialLog(`[API-GATEWAY] POST /verify { otp: "${code}", deviceId: "ESP32-MFA-01" }`, 'info');

    try {
      const result = await aws.verifyOtp({
        deviceId: 'ESP32-MFA-01',
        otp: code,
        userId: 'admin@cloudenterprise.io',
        totpEngine: totp
      });

      // Update counters
      if (statVerified) statVerified.textContent = aws.stats.verifiedCount;
      if (statFailed) statFailed.textContent = aws.stats.failedCount;
      if (statLatency) statLatency.textContent = `${aws.getAverageLatency()}ms`;
      recordChartLatency(result.latencyMs);
      updateCloudModeBadge();

      if (result.verified) {
        ui.playSuccessSound();
        blinkLed(ledAuth, 'led-green-active', 2000);
        oled.showSplash('AWS VERIFICATION', 'ACCESS GRANTED');
        ui.appendSerialLog(`[AWS-LAMBDA] Verification SUCCESS (Latency: ${result.latencyMs}ms)`, 'success');
        ui.appendSerialLog(`[SESSION] Token issued: ${result.sessionToken.slice(0, 16)}...`, 'info');

        if (verificationResultBanner) {
          verificationResultBanner.classList.remove('hidden');
          verificationResultBanner.className = 'p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/50 text-emerald-200 flex flex-col gap-2 mt-4 shadow-lg shadow-emerald-950/50';
          verificationResultBanner.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-extrabold text-emerald-400 text-sm">
                <svg class="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                🎉 ACCESS GRANTED - MFA Verified!
              </div>
              <span class="text-xs font-mono-code px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">${result.latencyMs}ms</span>
            </div>
            <p class="text-xs text-slate-200">
              Identity verified! AWS Lambda validated the physical token's cryptographic seed with drift compensation.
            </p>
            <div class="text-[11px] font-mono-code text-slate-400 bg-black/50 p-2 rounded flex items-center justify-between">
              <span>Session: ${result.sessionToken}</span>
              <span class="text-emerald-400 font-bold">DynamoDB Monotonic Lock OK</span>
            </div>
          `;
        }
        ui.showToast('Authentication Successful! Welcome back, Admin.', 'success');
      } else {
        ui.playErrorSound();
        blinkLed(ledAuth, 'led-red-active', 1500);
        oled.showSplash('AWS VERIFICATION', 'ACCESS DENIED');

        const isReplay = result.error === 'REPLAY_ATTACK_DETECTED';
        ui.appendSerialLog(`[AWS-LAMBDA] Verification FAILED: ${result.error}`, 'error');

        if (verificationResultBanner) {
          verificationResultBanner.classList.remove('hidden');
          verificationResultBanner.className = 'p-4 rounded-xl border border-rose-500/40 bg-rose-950/50 text-rose-200 flex flex-col gap-2 mt-4 shadow-lg shadow-rose-950/50';
          verificationResultBanner.innerHTML = `
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-extrabold text-rose-400 text-sm">
                <svg class="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.416 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                ${isReplay ? '🚨 REPLAY ATTACK BLOCKED BY AWS!' : '❌ VERIFICATION FAILED'}
              </div>
              <span class="text-xs font-mono-code px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700">${result.latencyMs}ms</span>
            </div>
            <p class="text-xs text-slate-200">
              ${isReplay
                ? 'Zero-Trust Replay Protection: This single-use code was already consumed! An attacker cannot intercept and reuse your token.'
                : (result.message || 'The OTP entered is either expired or did not match the token synchronized with AWS.')}
            </p>
          `;
        }
        ui.showToast(isReplay ? 'Replay attack blocked by AWS!' : 'Invalid or expired OTP', 'error');
      }

      renderMqttStream();
    } catch (err) {
      ui.showToast('Verification request error: ' + err.message, 'error');
    } finally {
      if (btnVerifyOtp) {
        btnVerifyOtp.disabled = false;
        btnVerifyOtp.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          Sign In &amp; Verify with AWS
        `;
      }
    }
  }

  /**
   * 1-Click Automated Demo Handler
   * Generates new OTP on ESP32 -> auto-fills into input -> executes AWS Lambda verification
   */
  async function runAutoDemo() {
    ui.showToast('Starting 1-Click Auto Demo...', 'info');

    // 1. Generate new OTP on Hardware Token
    await refreshOtp(true);

    // 2. Auto-fill into input
    if (currentTokenData && inputOtp) {
      inputOtp.value = currentTokenData.token;
      inputOtp.focus();
    }

    // Small natural delay so viewer sees the transition
    await new Promise(r => setTimeout(r, 600));

    // 3. Verify on AWS Lambda
    if (currentTokenData) {
      await performVerification(currentTokenData.token);
    }
  }

  /**
   * Test Replay Attack Demonstration
   * Tries to resubmit the last consumed code to showcase AWS security
   */
  async function testReplayAttack() {
    if (!currentTokenData) {
      await refreshOtp(false);
    }

    const code = currentTokenData ? currentTokenData.token : '123456';
    if (inputOtp) inputOtp.value = code;

    ui.showToast('Simulating Hacker Replay Attack with consumed OTP...', 'warning');
    ui.appendSerialLog(`[SECURITY-DEMO] Submitting duplicate code ${code} to test zero-trust replay block`, 'warn');

    // Submit code (if not yet consumed, verify it first, then resubmit to trigger replay)
    await performVerification(code);

    // Now resubmit immediately to demonstrate replay prevention
    setTimeout(async () => {
      await performVerification(code);
    }, 400);
  }

  // 1-Second Countdown Loop (updates remaining seconds and auto-generates OTP every 30s)
  setInterval(() => {
    const remaining = totp.getRemainingSeconds();
    if (currentTokenData) {
      oled.updateOtp(currentTokenData.token, remaining);
    }

    // Update countdown text & progress bar
    if (countdownText) {
      countdownText.textContent = `${remaining} seconds remaining`;
    }
    if (countdownBar) {
      const pct = Math.max(0, Math.min(100, (remaining / 30) * 100));
      countdownBar.style.width = `${pct}%`;
      if (remaining <= 5) {
        countdownBar.className = 'h-full bg-rose-500 transition-all duration-1000';
      } else if (remaining <= 10) {
        countdownBar.className = 'h-full bg-amber-500 transition-all duration-1000';
      } else {
        countdownBar.className = 'h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000';
      }
    }
    if (oledTimerLabel) {
      oledTimerLabel.textContent = `Expires in ${remaining}s`;
    }

    // Refresh OTP when 30-second window completes
    if (remaining === 30 && autoRefreshEnabled) {
      refreshOtp(false);
    }
  }, 1000);

  // ================= EVENT LISTENERS =================

  // Hardware Push Button
  if (btnGenerateOtp) {
    btnGenerateOtp.addEventListener('click', () => refreshOtp(true));
  }

  // Auto-fill into input
  if (btnAutofillOtp) {
    btnAutofillOtp.addEventListener('click', () => {
      if (currentTokenData && inputOtp) {
        inputOtp.value = currentTokenData.token;
        ui.showToast(`Auto-filled code: ${currentTokenData.token}`, 'success');
        inputOtp.focus();
      }
    });
  }

  // Copy Code
  if (btnCopyOtp) {
    btnCopyOtp.addEventListener('click', () => {
      if (currentTokenData) {
        navigator.clipboard.writeText(currentTokenData.token).catch(() => {});
        if (inputOtp) inputOtp.value = currentTokenData.token;
        ui.showToast(`Copied ${currentTokenData.token} to clipboard!`, 'info');
      }
    });
  }

  // Verify Button
  if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', (e) => {
      e.preventDefault();
      performVerification();
    });
  }

  // Auto-refresh Checkbox
  if (toggleAutoRefresh) {
    toggleAutoRefresh.addEventListener('change', (e) => {
      autoRefreshEnabled = e.target.checked;
      ui.showToast(autoRefreshEnabled ? 'Auto 30s OTP refresh enabled' : 'Auto refresh disabled (manual button only)', 'info');
    });
  }

  // Quick Demo Buttons
  if (btnQuickDemo) btnQuickDemo.addEventListener('click', runAutoDemo);
  if (btnHeaderQuickDemo) btnHeaderQuickDemo.addEventListener('click', runAutoDemo);
  if (btnQuickReplay) btnQuickReplay.addEventListener('click', testReplayAttack);
  if (btnTestReplayInline) btnTestReplayInline.addEventListener('click', testReplayAttack);

  // Clear Serial Console
  if (btnClearConsole) {
    btnClearConsole.addEventListener('click', () => {
      const monitor = document.getElementById('serial-monitor-log');
      if (monitor) monitor.innerHTML = '';
      ui.showToast('Serial console cleared', 'info');
    });
  }

  // Deep-Dive Inspector Tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => {
        b.classList.remove('active', 'text-cyan-400');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active');
      btn.classList.remove('text-slate-400');

      tabContents.forEach(content => {
        if (content.id === targetTabId) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    });
  });

  // AWS Learner Lab Modal Open/Close
  function openLearnerLabModal() {
    if (modalLearnerLab) {
      if (inputLearnerLabEndpoint) inputLearnerLabEndpoint.value = aws.apiEndpoint;
      if (inputLearnerLabRegion) inputLearnerLabRegion.value = aws.region;
      if (inputLearnerLabSecret) inputLearnerLabSecret.value = totp.secret;
      updateCloudModeBadge();
      modalLearnerLab.classList.remove('hidden');
    }
  }

  function closeLearnerLabModal() {
    if (modalLearnerLab) modalLearnerLab.classList.add('hidden');
  }

  if (btnOpenLearnerLab) btnOpenLearnerLab.addEventListener('click', openLearnerLabModal);
  if (btnStatusPill) btnStatusPill.addEventListener('click', openLearnerLabModal);
  if (btnCloseLearnerLab) btnCloseLearnerLab.addEventListener('click', closeLearnerLabModal);

  // Test Connection (Ping AWS)
  if (btnTestConnection) {
    btnTestConnection.addEventListener('click', async () => {
      const targetUrl = (inputLearnerLabEndpoint ? inputLearnerLabEndpoint.value : '').trim();
      if (!targetUrl) {
        ui.showToast('Please enter an endpoint URL to test', 'warning');
        return;
      }

      btnTestConnection.disabled = true;
      btnTestConnection.innerHTML = `
        <svg class="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-amber-300 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Pinging AWS...
      `;

      const result = await aws.testConnection(targetUrl);

      if (testConnectionResult) {
        testConnectionResult.classList.remove('hidden');
        if (result.ok) {
          testConnectionResult.className = 'p-3 rounded-lg text-xs font-mono-code bg-emerald-950/80 border border-emerald-500/50 text-emerald-300';
          testConnectionResult.innerHTML = `
            <div class="font-bold flex items-center gap-1.5">
              <span>✅</span> Connection Verified (HTTP ${result.status || 200})
            </div>
            <div class="mt-1 text-[11px] text-slate-300">Roundtrip Latency: ${result.latency}ms | Provider: ${result.source || 'AWS Lambda'}</div>
            <div class="text-[10px] text-emerald-400 mt-0.5">Ready to Lock In Permanently!</div>
          `;
          ui.showToast('AWS Connection Verified!', 'success');
        } else {
          testConnectionResult.className = 'p-3 rounded-lg text-xs font-mono-code bg-rose-950/80 border border-rose-500/50 text-rose-300';
          testConnectionResult.innerHTML = `
            <div class="font-bold flex items-center gap-1.5">
              <span>⚠️</span> Test Failed
            </div>
            <div class="mt-1 text-[11px] text-slate-300">${result.message}</div>
          `;
          ui.showToast('Connection test failed', 'error');
        }
      }

      btnTestConnection.disabled = false;
      btnTestConnection.innerHTML = '🧪 Test Connection (Ping AWS)';
    });
  }

  // Reset to Local Simulator
  if (btnResetSimulator) {
    btnResetSimulator.addEventListener('click', () => {
      aws.setEndpoints('us-east-1', '', '', false);
      if (inputLearnerLabEndpoint) inputLearnerLabEndpoint.value = '';
      updateCloudModeBadge();
      ui.showToast('Switched to built-in Lambda simulator', 'info');
      if (testConnectionResult) testConnectionResult.classList.add('hidden');
    });
  }

  // Save and Lock In Permanently
  if (formLearnerLab) {
    formLearnerLab.addEventListener('submit', (e) => {
      e.preventDefault();
      const newUrl = inputLearnerLabEndpoint ? inputLearnerLabEndpoint.value.trim() : '';
      const newRegion = inputLearnerLabRegion ? inputLearnerLabRegion.value.trim() : 'us-east-1';
      const newSecret = inputLearnerLabSecret ? inputLearnerLabSecret.value.trim() : 'JBSWY3DPEHPK3PXP';

      aws.setEndpoints(newRegion, newUrl, aws.iotEndpoint, true);
      totp.setSecret(newSecret || 'JBSWY3DPEHPK3PXP');

      updateCloudModeBadge();
      closeLearnerLabModal();
      ui.showToast('AWS Learner Lab connected permanently!', 'success');
      ui.appendSerialLog(`[CONFIG] Locked in permanent AWS endpoint: ${newUrl || 'Simulator'}`, 'success');
      refreshOtp(false);
    });
  }

  // Boot initial state
  await refreshOtp(false);
  initChart();
});
