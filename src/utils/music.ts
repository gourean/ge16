/**
 * Procedural 8-bit Music Synthesizer using Web Audio API
 * Supports multi-track patterns for Bass and Melody.
 */
class MusicSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTrack: string | null = null;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private tempo: number = 130;
  private lookahead: number = 25.0;
  private scheduleAheadTime: number = 0.1;
  private currentStep: number = 0;

  // MIDI to Frequency helper
  private mToF(midi: number): number {
    if (midi === 0) return 0;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private patterns: Record<string, { bass: number[], melody: number[] }> = {
    result: {
      bass: [
        60, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0,
        60, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0,
        55, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0,
        55, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0,
        60, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0,
        60, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0
      ],
      melody: [
        76, 0, 76, 0, 77, 0, 79, 0, 79, 0, 77, 0, 76, 0, 74, 0,
        72, 0, 72, 0, 74, 0, 76, 0, 76, 0, 0, 74, 74, 0, 0, 0,
        74, 0, 74, 0, 76, 0, 72, 0, 74, 0, 76, 77, 76, 0, 72, 0,
        74, 0, 76, 77, 76, 0, 74, 0, 72, 0, 74, 0, 67, 0, 0, 0,
        76, 0, 76, 0, 77, 0, 79, 0, 79, 0, 77, 0, 76, 0, 74, 0,
        72, 0, 72, 0, 74, 0, 76, 0, 74, 0, 0, 72, 72, 0, 0, 0
      ]
    },
    intro: {
      bass: [
        40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0,
        36, 0, 36, 0, 36, 0, 36, 0, 36, 0, 36, 0, 36, 0, 36, 0,
        40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0,
        35, 0, 35, 0, 35, 0, 35, 0, 38, 0, 38, 0, 38, 0, 38, 0,
        40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0,
        36, 0, 36, 0, 36, 0, 36, 0, 36, 0, 36, 0, 36, 0, 36, 0,
        40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0, 40, 0,
        35, 0, 35, 0, 38, 0, 38, 0, 40, 0, 40, 0, 40, 0, 40, 0
      ],
      melody: [
        64, 0, 66, 0, 67, 0, 0, 0, 64, 0, 0, 0, 71, 0, 69, 0,
        67, 0, 66, 0, 64, 0, 0, 0, 67, 0, 66, 0, 64, 0, 0, 0,
        64, 0, 66, 0, 67, 0, 0, 0, 64, 0, 0, 0, 71, 0, 74, 0,
        76, 0, 0, 0, 74, 0, 0, 0, 71, 0, 69, 0, 67, 0, 0, 0,
        64, 0, 66, 0, 67, 0, 0, 0, 64, 0, 0, 0, 71, 0, 69, 0,
        67, 0, 66, 0, 64, 0, 0, 0, 67, 0, 66, 0, 64, 0, 0, 0,
        64, 0, 66, 0, 67, 0, 0, 0, 64, 0, 0, 0, 71, 0, 74, 0,
        76, 0, 0, 0, 74, 0, 0, 0, 71, 0, 69, 0, 67, 0, 0, 0
      ]
    }
  };

  constructor() {
    this.patterns.campaign = this.patterns.intro;
  }

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public startTrack(trackName: string) {
    const ctx = this.getCtx();
    if (this.currentTrack === trackName && this.isPlaying) return;

    this.stopTrack();
    
    this.currentTrack = trackName;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime;
    
    this.scheduler();
  }

  public stopTrack() {
    this.isPlaying = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.currentTrack = null;
  }

  public setVolume(volume: number, isMuted: boolean) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(isMuted ? 0 : volume / 100, this.ctx!.currentTime, 0.1);
    }
  }

  private scheduler() {
    if (!this.isPlaying) return;

    const secondsPerStep = 60 / this.tempo / 4;

    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += secondsPerStep;
      this.currentStep++;
      const pattern = this.patterns[this.currentTrack || 'intro'];
      if (this.currentStep >= pattern.bass.length) {
        this.currentStep = 0;
      }
    }
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private scheduleStep(step: number, time: number) {
    if (!this.currentTrack || !this.masterGain) return;
    const pattern = this.patterns[this.currentTrack];
    const duration = 60 / this.tempo / 4;

    // Bass
    if (pattern.bass[step] > 0) {
      this.playTone(this.mToF(pattern.bass[step]), time, duration, 'square', 0.15);
    }

    // Melody
    if (pattern.melody[step] > 0) {
      this.playTone(this.mToF(pattern.melody[step]), time, duration, 'square', 0.1);
    }
  }

  private playTone(freq: number, time: number, duration: number, type: OscillatorType, volume: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + duration);
  }
}

export const musicSynth = new MusicSynthesizer();
