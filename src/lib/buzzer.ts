"use client";

// Zero-dependency Web Audio API + Haptic Buzzer synthesizer for ClimbCoin

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioCtx: AudioContext | null = null;
let buzzerMuted = false;

export function getBuzzerMuted(): boolean {
  return buzzerMuted;
}

export function setBuzzerMuted(muted: boolean): void {
  buzzerMuted = muted;
}

export function unlockAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext || (window as unknown as WebkitWindow).webkitAudioContext;
      if (Ctor) {
        audioCtx = new Ctor();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function triggerHaptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || buzzerMuted) return;
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore on browsers without vibration support
  }
}

/**
 * Crisp ascending dual-tone chime (880Hz -> 1320Hz, ~120ms) + short vibration.
 * Fired on stairwell Tap-In (Floor 1).
 */
export function playTapIn(): void {
  triggerHaptic(45);
  if (buzzerMuted) return;

  const ctx = unlockAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.06);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    gain.gain.setValueAtTime(0.22, now + 0.055);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.068);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.135);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  } catch {
    // Ignore audio context scheduling errors
  }
}

/**
 * Bright 3-note emerald confirmation chime + double pulse vibration.
 * Fired when Gemini verifies a 3-signal stair climb.
 */
export function playVerified(): void {
  triggerHaptic([55, 45, 95]);
  if (buzzerMuted) return;

  const ctx = unlockAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 587.33, start: 0, dur: 0.075 }, // D5
      { freq: 880.0, start: 0.075, dur: 0.075 }, // A5
      { freq: 1174.66, start: 0.15, dur: 0.16 }, // D6
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.24, now + n.start + 0.012);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + n.start + n.dur
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.01);
    }
  } catch {
    // Ignore audio context scheduling errors
  }
}

/**
 * Low warning double-buzz (220Hz sawtooth, ~250ms) + long vibration.
 * Fired when a lift spoof or speed anomaly is blocked.
 */
export function playSpoofAlert(): void {
  triggerHaptic([160, 60, 210]);
  if (buzzerMuted) return;

  const ctx = unlockAudio();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const pulses = [
      { start: 0, dur: 0.115 },
      { start: 0.145, dur: 0.125 },
    ];

    for (const p of pulses) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now + p.start);
      osc.frequency.linearRampToValueAtTime(185, now + p.start + p.dur);

      gain.gain.setValueAtTime(0.001, now + p.start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + p.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.start + p.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + p.start);
      osc.stop(now + p.start + p.dur + 0.01);
    }
  } catch {
    // Ignore audio context scheduling errors
  }
}
