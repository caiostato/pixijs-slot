/**
 * WinAudioFX — Agent 4 (Audio) responsibility.
 *
 * Generates procedural celebration sounds using the Web Audio API
 * when no audio files are available, and orchestrates Howler.js
 * sounds when they are.
 *
 * This class does NOT mutate GameState. It only reads and plays.
 */
export class WinAudioFX {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.15;
      this.masterGain.connect(this.audioCtx.destination);
    }
  }

  /**
   * Plays the full grand win audio sequence:
   * 1. A bright ascending arpeggio (coin collect feel)
   * 2. A shimmering chord pad underneath
   * 3. Sparkle SFX bursts
   */
  public playGrandWin() {
    if (!this.audioCtx || !this.masterGain || this.isMuted) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.stopAll();

    const now = this.audioCtx.currentTime;

    // 1. Ascending arpeggio — pentatonic scale for a "winning" feel
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    notes.forEach((freq, i) => {
      this.playNote(freq, now + i * 0.12, 0.3, 'triangle', 0.12);
    });

    // 2. Sustained chord pad (C major)
    const chordFreqs = [261.63, 329.63, 392.00]; // C4, E4, G4
    chordFreqs.forEach(freq => {
      this.playNote(freq, now + 0.1, 2.0, 'sine', 0.04);
    });

    // 3. Sparkle bursts — high-frequency noise-like tones
    for (let i = 0; i < 6; i++) {
      const sparkleTime = now + 0.8 + i * 0.15;
      const sparkleFreq = 2000 + Math.random() * 3000;
      this.playNote(sparkleFreq, sparkleTime, 0.08, 'sine', 0.03);
    }

    // 4. Final triumphant chord hit
    const finalChord = [523.25, 659.25, 783.99, 1046.50];
    finalChord.forEach(freq => {
      this.playNote(freq, now + 1.6, 1.5, 'triangle', 0.06);
    });
  }

  /**
   * Plays a single coin "ding" — for each reel stop or coin spawn.
   */
  public playCoinDing() {
    if (!this.audioCtx || !this.masterGain || this.isMuted) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const freq = 1200 + Math.random() * 800;
    this.playNote(freq, now, 0.15, 'sine', 0.06);
  }

  /**
   * Low-level: schedule a single oscillator note.
   */
  private playNote(
    frequency: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Envelope: quick attack, sustain, smooth release
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.setValueAtTime(volume, startTime + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    this.activeOscillators.push(osc);

    // Self-cleanup
    osc.onended = () => {
      const idx = this.activeOscillators.indexOf(osc);
      if (idx !== -1) this.activeOscillators.splice(idx, 1);
      osc.disconnect();
      gain.disconnect();
    };
  }

  public stopAll() {
    const now = this.audioCtx?.currentTime ?? 0;
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop(now + 0.05);
      } catch {
        // Already stopped
      }
    });
    this.activeOscillators = [];
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopAll();
  }

  public destroy() {
    this.stopAll();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
