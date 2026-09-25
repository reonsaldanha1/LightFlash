/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API AudioContext singleton for zero-latency tactical audio & SOS beeper
let audioCtx: AudioContext | null = null;
let currentMorseOsc: OscillatorNode | null = null;
let currentMorseGain: GainNode | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Mechanical tactical toggle click (realistic metal switch sound)
 */
export function playTacticalClick(isOn = true): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = isOn ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(isOn ? 1200 : 750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isOn ? 220 : 150, ctx.currentTime + 0.04);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);

    triggerHaptic(isOn ? [25] : [15, 15]);
  } catch {
    // Audio Context might be blocked until user gesture
  }
}

/**
 * Start a continuous pure tone for Morse code (SOS)
 */
export function startMorseTone(freq = 800): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (currentMorseOsc) {
      return; // Already playing
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    currentMorseOsc = osc;
    currentMorseGain = gain;
  } catch {
    // Audio might be blocked
  }
}

/**
 * Stop the Morse code tone
 */
export function stopMorseTone(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx || !currentMorseOsc || !currentMorseGain) return;

    currentMorseGain.gain.setValueAtTime(currentMorseGain.gain.value, ctx.currentTime);
    currentMorseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);

    const osc = currentMorseOsc;
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    }, 15);

    currentMorseOsc = null;
    currentMorseGain = null;
  } catch {}
}

/**
 * Strobe tick audio burst
 */
export function playStrobeTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch {}
}

/**
 * Tactical vibration patterns tailored for low-visibility tactile feedback
 */
export const HAPTIC_PATTERNS = {
  // Heavy solid pulse when turning on high-power flashlight
  POWER_ON: [45],
  // Quick double tactile tick when turning off
  POWER_OFF: [20, 30, 20],
  // Crisp single pulse for steady beam mode
  MODE_STEADY: [25],
  // Rapid double pulse for strobe burst mode
  MODE_STROBE: [18, 25, 18],
  // Urgent Morse pulse for SOS Distress mode (tactical dot-dash rhythm)
  MODE_SOS: [25, 35, 55, 35, 25],
  // Solid double latch pulse for E2EE Vault mode
  MODE_VAULT: [30, 25, 30],
  // Crisp click for tactical buttons / switches
  BUTTON_CLICK: [18],
  // Distinct confirmation double-pulse when preferences are saved
  SAVE_PREFS: [25, 30, 40],
} as const;

/**
 * Tactical haptic feedback vibration using the browser Vibration API
 */
export function triggerHaptic(pattern: number | readonly number[] | number[] = 20): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern as VibratePattern);
    } catch {
      // Ignore vibration errors if not supported or disabled by user agent
    }
  }
}

