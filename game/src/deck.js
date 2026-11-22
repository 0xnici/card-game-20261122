// deck.js — a small seeded RNG and the draw pile / discard pile / hand.
// The seed makes screenshot setups reproducible; real play seeds from the clock.

/** mulberry32: a tiny deterministic PRNG. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle of `arr` in place, driven by `rng`. */
export function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** A draw pile that reshuffles the discard pile when it runs out. */
export class DrawPile {
  constructor(cardIds, rng) {
    this.rng = rng;
    this.draw = shuffle(cardIds.slice(), rng);
    this.discard = [];
  }

  drawOne() {
    if (this.draw.length === 0) {
      if (this.discard.length === 0) return null;
      this.draw = shuffle(this.discard, this.rng);
      this.discard = [];
    }
    return this.draw.pop();
  }

  discardCard(id) {
    this.discard.push(id);
  }

  get drawCount() { return this.draw.length; }
  get discardCount() { return this.discard.length; }
}
