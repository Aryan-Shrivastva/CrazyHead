/**
 * Web Audio API Synthesizer for F1 V6 Turbo Hybrid Engine & Racing Sound FX
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Engine Audio Nodes
    this.engineGain = null;
    this.osc1 = null; // Fundamental low rumble
    this.osc2 = null; // High pitch turbo whine
    this.osc3 = null; // Harmonic growl
    this.noiseNode = null; // Exhaust rush / wind
    this.noiseGain = null;
    this.filter = null;

    // Tire Screech Nodes
    this.screechGain = null;
    this.screechOsc = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupEngineSynth();
      this.setupScreechSynth();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupEngineSynth() {
    if (!this.ctx) return;

    // Master engine gain
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Low rumble oscillator (sawtooth)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Harmonic mid growl (square)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    // High turbo whine (sine)
    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = 'sine';
    this.osc3.frequency.setValueAtTime(300, this.ctx.currentTime);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    const osc3Gain = this.ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    // Lowpass filter for natural acoustic dampening
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(3, this.ctx.currentTime);

    // Connect oscillators
    this.osc1.connect(this.filter);
    this.osc2.connect(osc2Gain);
    osc2Gain.connect(this.filter);
    this.osc3.connect(osc3Gain);
    osc3Gain.connect(this.engineGain);

    this.filter.connect(this.engineGain);

    // Noise node for airflow/exhaust
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.engineGain);

    this.engineGain.connect(this.ctx.destination);

    // Start oscillators
    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
    whiteNoise.start();
  }

  setupScreechSynth() {
    if (!this.ctx) return;
    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.screechOsc = this.ctx.createOscillator();
    this.screechOsc.type = 'sawtooth';
    this.screechOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const screechFilter = this.ctx.createBiquadFilter();
    screechFilter.type = 'bandpass';
    screechFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    screechFilter.Q.setValueAtTime(5, this.ctx.currentTime);

    this.screechOsc.connect(screechFilter);
    screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.ctx.destination);
    this.screechOsc.start();
  }

  updateEngine(rpmRatio, throttle, speedKmH) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // RPM Frequency Mapping (Idle ~ 45Hz, Max RPM ~ 280Hz)
    const baseFreq = 45 + rpmRatio * 230;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.osc2.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.05);
    this.osc3.frequency.setTargetAtTime(500 + rpmRatio * 1800, now, 0.08); // Turbo spool

    // Filter frequency opens up on full throttle
    const filterFreq = 400 + throttle * 2800 + rpmRatio * 2000;
    this.filter.frequency.setTargetAtTime(filterFreq, now, 0.05);

    // Noise volume with speed
    const noiseVol = Math.min(speedKmH / 350, 1.0) * 0.15;
    this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.05);

    // Target volume
    const targetVol = 0.12 + throttle * 0.18 + rpmRatio * 0.1;
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  playGearShiftSound() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Momentary ignition cut & backfire pop
    this.engineGain.gain.setValueAtTime(0.02, now);
    this.engineGain.gain.setTargetAtTime(0.25, now + 0.06, 0.04);

    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(120, now);
    popOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    popGain.gain.setValueAtTime(0.3, now);
    popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);

    popOsc.start(now);
    popOsc.stop(now + 0.09);
  }

  setTireScreech(intensity) {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetGain = Math.min(Math.max(intensity, 0), 1) * 0.18;
    this.screechGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  playGantryLightBeep(isFinal = false) {
    this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    if (isFinal) {
      // High pitch "GO" tone
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      // Red light tone
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);
  }

  playRadioChime() {
    this.init();
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
