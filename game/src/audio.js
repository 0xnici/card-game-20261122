// audio.js — tiny synthesized blips (Web Audio, no assets). Created lazily on the
// first user gesture; every call is guarded so headless play never throws.

let ctx = null;

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

/** Play a short tone: `freq` Hz, `ms` long, `type` oscillator shape, quiet. */
export function blip(freq, ms = 90, type = 'sine', gain = 0.05) {
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + ms / 1000);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + ms / 1000);
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

export const sfx = {
  playCard: () => blip(520, 90, 'triangle', 0.06),
  resonance: () => { blip(660, 80, 'triangle', 0.06); setTimeout(() => blip(880, 110, 'triangle', 0.06), 70); },
  hurt: () => blip(140, 160, 'sawtooth', 0.05),
  heal: () => blip(740, 120, 'sine', 0.05),
  win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 160, 'triangle', 0.06), i * 110)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 180, 'sine', 0.05), i * 130)); },
  click: () => blip(440, 50, 'sine', 0.04),
};
