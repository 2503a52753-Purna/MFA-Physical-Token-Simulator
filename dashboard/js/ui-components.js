/**
 * ui-components.js - Audio synthesizers, Serial Monitor, Toasts, and Visual Effects
 * Author: Purna Chandar Reddy
 */

class UiComponents {
  constructor() {
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Synthesized mechanical tactile click sound
  playClickSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio not permitted or supported
    }
  }

  // Synthesized success chime
  playSuccessSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch (e) {}
  }

  // Synthesized denial buzz
  playErrorSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // Toast notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-900/90 border-emerald-500 text-emerald-100',
      error: 'bg-rose-900/90 border-rose-500 text-rose-100',
      warning: 'bg-amber-900/90 border-amber-500 text-amber-100',
      info: 'bg-sky-900/90 border-sky-500 text-sky-100'
    };

    toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg backdrop-blur text-sm transition-all duration-300 transform translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Append line to virtual ESP32 Serial Monitor
  appendSerialLog(text, level = 'info') {
    const monitor = document.getElementById('serial-monitor-log');
    if (!monitor) return;

    const time = new Date().toLocaleTimeString();
    const colors = {
      info: 'text-slate-300',
      warn: 'text-amber-400',
      error: 'text-rose-400',
      success: 'text-emerald-400',
      crypto: 'text-cyan-400',
      mqtt: 'text-orange-400'
    };

    const line = document.createElement('div');
    line.className = `font-mono-code text-xs leading-relaxed ${colors[level] || colors.info}`;
    line.innerHTML = `<span class="text-slate-500">[${time}]</span> ${text}`;

    monitor.appendChild(line);

    // Keep max 100 lines
    while (monitor.childNodes.length > 100) {
      monitor.removeChild(monitor.firstChild);
    }

    monitor.scrollTop = monitor.scrollHeight;
  }
}

window.UiComponents = UiComponents;
