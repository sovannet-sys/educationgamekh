/**
 * Web Audio API Sound Synthesizer for Math & Khmer Educational App
 * Implements lightweight, zero-latency, realistic synthesized sound effects.
 */

class AudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialize to bypass autoplay restrictions until a user interaction occurs
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('app_sound_muted') === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('app_sound_muted', String(this.isMuted));
    return this.isMuted;
  }

  getMuteState() {
    return this.isMuted;
  }

  /**
   * Play a clean click sound (for UI buttons or ticking)
   */
  playClick(pitch = 800, duration = 0.05, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio click failed', e);
    }
  }

  /**
   * Play card shuffle sound (series of fast slide/flick sounds)
   */
  playCardShuffle() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const cardCount = 6;
      
      for (let i = 0; i < cardCount; i++) {
        const startTime = now + i * 0.08;
        const duration = 0.06;

        // Bandpassed noise burst to simulate card flick/slide
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200 + i * 150, startTime);
        filter.Q.setValueAtTime(4, startTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(startTime);
        noise.stop(startTime + duration);
      }
    } catch (e) {
      console.warn('Audio shuffle failed', e);
    }
  }

  /**
   * Play spinning wheel click sounds with natural deceleration
   */
  playWheelSpin(durationSeconds = 4.0) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      let elapsed = 0;
      let delay = 0.04; // Start fast (40ms)

      // Create click scheduling loop that slows down
      while (elapsed < durationSeconds) {
        const playTime = now + elapsed;
        
        // Schedule a single tick/click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900 - (elapsed / durationSeconds) * 400, playTime);
        
        // Decay envelope
        gain.gain.setValueAtTime(0.08, playTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.015);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(playTime);
        osc.stop(playTime + 0.02);

        // Increase delay according to an exponential deceleration curve
        const progress = elapsed / durationSeconds;
        // Cubic-like slowing down
        delay = 0.04 + Math.pow(progress, 3) * 0.45;
        elapsed += delay;
      }

      // Schedule success fanfare at the end
      setTimeout(() => {
        this.playSuccessChime();
      }, durationSeconds * 1000);

    } catch (e) {
      console.warn('Audio spin failed', e);
    }
  }

  /**
   * Play realistic dice rolling/tumbling sounds
   */
  playDiceRoll() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bounces = 7 + Math.floor(Math.random() * 4); // 7 to 10 bounces
      let elapsed = 0;

      for (let i = 0; i < bounces; i++) {
        // Schedule each bounce with slightly randomized timing and declining volume
        const playTime = now + elapsed;
        const volume = 0.12 * (1 - (i / bounces) * 0.6);
        const pitch = 140 + Math.random() * 80; // Low-pitch clacking

        // Oscillator for the wood/plastic body sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, playTime);
        
        // Fast pitch slide down representing impact
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, playTime + 0.04);

        gain.gain.setValueAtTime(volume, playTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.05);

        // Add a tiny noise burst for the click/impact
        const noiseSize = ctx.sampleRate * 0.01; // 10ms
        const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let j = 0; j < noiseSize; j++) {
          noiseData[j] = Math.random() * 2 - 1;
        }
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1000, playTime);
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.4, playTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.01);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(playTime);
        osc.stop(playTime + 0.06);
        
        noiseNode.start(playTime);
        noiseNode.stop(playTime + 0.02);

        // Randomize elapsed time to next bounce
        elapsed += 0.08 + (i * 0.02) + Math.random() * 0.05;
      }
    } catch (e) {
      console.warn('Audio dice failed', e);
    }
  }

  /**
   * Play happy chime sound for success / winning / completion
   */
  playSuccessChime() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Arpeggio of notes: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.08;
        const duration = 0.25;

        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator(); // Subharmonic for richness
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq / 2, startTime);

        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        osc2.start(startTime);
        osc2.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('Audio success chime failed', e);
    }
  }
}

export const audioSynth = new AudioSynth();
