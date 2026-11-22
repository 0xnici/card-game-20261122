// cards.js — the card catalogue of Emberfall Duel. Every card is an original design:
// an element (Ember / Tide / Thorn / Stone), a mana cost, and one or two effects.
// Elements form a cycle: Ember beats Thorn, Thorn beats Tide, Tide beats Ember.
// Stone is neutral and never gains or suffers advantage. Playing two cards of the
// same element in one turn triggers Resonance: +3 damage or +3 block on the second.

export const ELEMENTS = {
  ember: { name: 'Ember', color: '#e8542f', dark: '#8f2f14', light: '#ffb37a', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f7fd0', dark: '#174a80', light: '#8ec8ff', glyph: 'drop' },
  thorn: { name: 'Thorn', color: '#4da34d', dark: '#245c26', light: '#a5e08a', glyph: 'leaf' },
  stone: { name: 'Stone', color: '#9a8f7a', dark: '#57503f', light: '#e6dcc4', glyph: 'rock' },
};

/** Element `a` beats element `b` in the advantage cycle (Stone beats nothing). */
export function beats(a, b) {
  return (a === 'ember' && b === 'thorn') ||
    (a === 'thorn' && b === 'tide') ||
    (a === 'tide' && b === 'ember');
}

/**
 * One card design. Effects are plain data so the rules stay readable:
 * damage, block, heal, draw are applied in that order when the card is played.
 */
export const CARD_DEFS = [
  { id: 'ember-slash', name: 'Ember Slash', element: 'ember', cost: 1, damage: 6, text: 'Deal 6 damage.' },
  { id: 'ember-burst', name: 'Ember Burst', element: 'ember', cost: 2, damage: 11, text: 'Deal 11 damage.' },
  { id: 'cinder-fang', name: 'Cinder Fang', element: 'ember', cost: 1, damage: 5, block: 2, text: 'Deal 5 damage. Gain 2 block.' },
  { id: 'tide-cut', name: 'Tide Cut', element: 'tide', cost: 1, damage: 5, draw: 1, text: 'Deal 5 damage. Draw 1 card.' },
  { id: 'tide-surge', name: 'Tide Surge', element: 'tide', cost: 2, damage: 8, heal: 3, text: 'Deal 8 damage. Heal 3.' },
  { id: 'wave-mend', name: 'Wave Mend', element: 'tide', cost: 1, heal: 6, block: 2, text: 'Heal 6. Gain 2 block.' },
  { id: 'thorn-whip', name: 'Thorn Whip', element: 'thorn', cost: 1, damage: 4, block: 4, text: 'Deal 4 damage. Gain 4 block.' },
  { id: 'thorn-snare', name: 'Thorn Snare', element: 'thorn', cost: 2, damage: 7, draw: 1, text: 'Deal 7 damage. Draw 1 card.' },
  { id: 'root-shield', name: 'Root Shield', element: 'thorn', cost: 1, block: 6, draw: 1, text: 'Gain 6 block. Draw 1 card.' },
  { id: 'stone-guard', name: 'Stone Guard', element: 'stone', cost: 1, block: 8, text: 'Gain 8 block.' },
  { id: 'stone-slam', name: 'Stone Slam', element: 'stone', cost: 2, damage: 9, text: 'Deal 9 damage.' },
  { id: 'boulder-toss', name: 'Boulder Toss', element: 'stone', cost: 3, damage: 14, text: 'Deal 14 damage.' },
];

/** The starting deck: 20 cards, five copies of the four cost-1 openers plus the rest. */
export function startingDeckIds() {
  const ids = [];
  const counts = {
    'ember-slash': 3, 'cinder-fang': 2, 'tide-cut': 2, 'wave-mend': 2,
    'thorn-whip': 2, 'root-shield': 2, 'stone-guard': 2, 'ember-burst': 1,
    'tide-surge': 1, 'thorn-snare': 1, 'stone-slam': 1, 'boulder-toss': 1,
  };
  for (const def of CARD_DEFS) {
    for (let i = 0; i < (counts[def.id] ?? 0); i++) ids.push(def.id);
  }
  return ids;
}

/** A fresh card instance from a design id (instances carry no shared state). */
export function makeCard(id, uid) {
  const def = CARD_DEFS.find((d) => d.id === id);
  return { uid, ...def };
}

/** The three draft choices offered after each victory round (a new card to add). */
export function draftChoices() {
  return ['ember-burst', 'tide-surge', 'thorn-snare', 'stone-slam', 'boulder-toss', 'wave-mend'];
}
