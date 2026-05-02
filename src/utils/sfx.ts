import { useGameStore } from '../store/gameStore';

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
};

/**
 * Snappy click/pop sound for UI buttons.
 */
export const playClick = () => {
  const { audioSettings } = useGameStore.getState();
  if (audioSettings.isMuted || audioSettings.sfxVolume <= 0) return;

  const ctx = getCtx();
  
  // Create nodes
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const volume = audioSettings.sfxVolume / 100;

  // Snappy frequency drop
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);

  // Fast volume decay
  gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

/**
 * Soft chime/sweep sound for notifications or modals.
 */
export const playPopup = () => {
  const { audioSettings } = useGameStore.getState();
  if (audioSettings.isMuted || audioSettings.sfxVolume <= 0) return;

  const ctx = getCtx();
  const volume = audioSettings.sfxVolume / 100;

  // Layer 1: Fast rising chime
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(400, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);
  
  gain1.gain.setValueAtTime(0, ctx.currentTime);
  gain1.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.05);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  // Layer 2: Deep sine swell
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(300, ctx.currentTime);
  osc2.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
  
  gain2.gain.setValueAtTime(0, ctx.currentTime);
  gain2.gain.linearRampToValueAtTime(volume * 0.2, ctx.currentTime + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 0.5);
  osc2.stop(ctx.currentTime + 0.8);
};

/**
 * Triumphant chime for finishing a day.
 */
export const playDayEnd = () => {
  const { audioSettings } = useGameStore.getState();
  if (audioSettings.isMuted || audioSettings.sfxVolume <= 0) return;

  const ctx = getCtx();
  const volume = audioSettings.sfxVolume / 100;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(300, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
  osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);
  
  gain1.gain.setValueAtTime(0, ctx.currentTime);
  gain1.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.1);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start();
  osc1.stop(ctx.currentTime + 0.6);
};

/**
 * Low discordant buzz for errors or backlash.
 */
export const playError = () => {
  const { audioSettings } = useGameStore.getState();
  if (audioSettings.isMuted || audioSettings.sfxVolume <= 0) return;

  const ctx = getCtx();
  const volume = audioSettings.sfxVolume / 100;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};
