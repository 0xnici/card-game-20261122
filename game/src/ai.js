// ai.js — Cinder Golem, the opponent. Every turn it declares an intent you can
// read and counter, then acts on it: a heavy strike, a guard, or a stance shift
// that changes which of your elements hits it hardest. Its stance is the element
// your cards are strong or weak against, so the hand you keep matters.

import { ELEMENTS } from './cards.js';

const STANCES = ['ember', 'tide', 'thorn', 'stone'];

/** The golem's next intent, chosen from the turn number and the seeded RNG. */
export function chooseIntent(turn, rng, golemHp, golemMaxHp) {
  const roll = rng();
  // Hurt golems get defensive more often; every 4th turn it shifts stance.
  if (turn % 4 === 0) {
    const stance = STANCES[Math.floor(rng() * STANCES.length)];
    return { kind: 'shift', stance, damage: 0, block: 0, label: `Shift stance to ${ELEMENTS[stance].name}` };
  }
  if (golemHp <= golemMaxHp * 0.4 && roll < 0.4) {
    const block = 7 + Math.floor(rng() * 4);
    return { kind: 'guard', damage: 0, block, label: `Guard +${block} block` };
  }
  if (roll < 0.62) {
    const damage = 6 + Math.floor(rng() * 4);
    return { kind: 'strike', damage, block: 0, label: `Strike for ${damage}` };
  }
  if (roll < 0.85) {
    const damage = 9 + Math.floor(rng() * 4);
    const block = 3 + Math.floor(rng() * 3);
    return { kind: 'slam', damage, block, label: `Slam for ${damage} + guard ${block}` };
  }
  const block = 5 + Math.floor(rng() * 4);
  return { kind: 'guard', damage: 0, block, label: `Guard +${block} block` };
}

/** The golem's taunt line for its current intent (flavour only, no gameplay effect). */
export function taunt(intent) {
  if (intent.kind === 'shift') return 'The golem\u2019s embers rearrange\u2026';
  if (intent.kind === 'guard') return 'The golem raises a slab of stone.';
  if (intent.kind === 'slam') return 'The golem winds up a crushing slam!';
  return 'The golem bares its burning fists.';
}
