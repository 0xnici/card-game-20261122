// game.js — the rules of Emberfall Duel: turns, mana, resonance, advantage,
// block, and the win/loss conditions. Rendering lives in render.js; input in
// input.js. Nothing here touches the DOM except through the callbacks below.

import { CARD_DEFS, ELEMENTS, beats, makeCard, startingDeckIds } from './cards.js';
import { DrawPile, makeRng } from './deck.js';
import { chooseIntent, taunt } from './ai.js';
import { sfx } from './audio.js';

export const PLAYER_MAX_HP = 30;
export const GOLEM_MAX_HP = 45;
export const HAND_SIZE = 5;
export const MAX_MANA = 3;

export class Game {
  constructor(seed = 20261122) {
    this.rng = makeRng(seed);
    this.screen = 'title';
    this.uidCounter = 1;
    this.reset();
  }

  reset() {
    this.turn = 1;
    this.mana = MAX_MANA;
    this.playerHp = PLAYER_MAX_HP;
    this.playerBlock = 0;
    this.golemHp = GOLEM_MAX_HP;
    this.golemBlock = 0;
    this.golemStance = 'ember';
    this.hand = [];
    this.playedElements = [];
    this.log = 'Welcome to Emberfall Duel. Press ENTER or click to begin.';
    this.stats = { turns: 0, damageDealt: 0, cardsPlayed: 0, damageTaken: 0, healed: 0 };
    this.pile = new DrawPile(startingDeckIds(), this.rng);
    this.intent = chooseIntent(1, this.rng, this.golemHp, GOLEM_MAX_HP);
    this.floaters = [];
    this.lastPlay = null;
  }

  /** Begin a battle from the title screen. */
  startPlay() {
    this.reset();
    this.screen = 'play';
    this.drawCards(HAND_SIZE);
    this.log = 'Turn 1 — play cards, then END TURN. Match the golem\u2019s stance for +3 damage.';
    sfx.click();
  }

  drawCards(n) {
    for (let i = 0; i < n; i++) {
      const id = this.pile.drawOne();
      if (id === null) break;
      this.hand.push(makeCard(id, this.uidCounter++));
    }
  }

  /** Effective damage of `card` against the golem's current stance. */
  cardDamage(card) {
    let dmg = card.damage ?? 0;
    if (dmg > 0 && beats(card.element, this.golemStance)) dmg += 3;
    if (dmg > 0 && this.playedElements.includes(card.element)) dmg += 3; // Resonance
    return dmg;
  }

  resonanceFor(card) {
    return this.playedElements.includes(card.element);
  }

  canPlay(card) {
    return this.screen === 'play' && card.cost <= this.mana;
  }

  /** Play the card at hand index `i`. Returns a message for the log, or null. */
  playCard(i) {
    if (this.screen !== 'play') return null;
    const card = this.hand[i];
    if (!card) return null;
    if (card.cost > this.mana) {
      this.log = `Not enough mana for ${card.name} (needs ${card.cost}).`;
      return this.log;
    }
    this.hand.splice(i, 1);
    this.mana -= card.cost;
    this.stats.cardsPlayed++;
    const resonance = this.resonanceFor(card);
    this.playedElements.push(card.element);

    const parts = [];
    const dmg = this.cardDamage(card);
    if (dmg > 0) {
      const dealt = Math.max(0, dmg - this.golemBlock);
      this.golemBlock = Math.max(0, this.golemBlock - dmg);
      this.golemHp = Math.max(0, this.golemHp - dealt);
      this.stats.damageDealt += dealt;
      parts.push(`${card.name} hits for ${dmg}${beats(card.element, this.golemStance) ? ' (advantage!)' : ''}${resonance ? ' (Resonance +3!)' : ''}`);
      this.floaters.push({ x: 640, y: 300, text: `-${dealt}`, color: '#ffd34d', t: 0 });
      sfx.playCard();
      if (resonance) sfx.resonance();
    }
    if (card.block) {
      const blk = card.block + (resonance ? 3 : 0);
      this.playerBlock += blk;
      parts.push(`gain ${blk} block`);
    }
    if (card.heal) {
      const healed = Math.min(card.heal, PLAYER_MAX_HP - this.playerHp);
      this.playerHp += healed;
      this.stats.healed += healed;
      parts.push(`heal ${healed}`);
      sfx.heal();
    }
    if (card.draw) {
      this.drawCards(card.draw);
      parts.push(`draw ${card.draw}`);
    }
    this.pile.discardCard(card.id);
    this.lastPlay = { card, resonance, at: Date.now() };
    this.log = parts.join(' · ') || `${card.name} played.`;
    if (this.golemHp <= 0) return this.finish(true);
    return this.log;
  }

  /** End the player's turn: the golem acts on its declared intent, then a new turn starts. */
  endTurn() {
    if (this.screen !== 'play') return null;
    const intent = this.intent;
    this.stats.turns = this.turn;
    // The golem's block wears off as it acts; the player's block wears off at the new turn.
    this.golemBlock = 0;
    let msg;
    if (intent.kind === 'shift') {
      this.golemStance = intent.stance;
      msg = `${taunt(intent)} Stance is now ${ELEMENTS[intent.stance].name}.`;
    } else if (intent.kind === 'guard') {
      this.golemBlock += intent.block;
      msg = `Golem guards for +${intent.block} block.`;
    } else {
      const hit = Math.max(0, intent.damage - this.playerBlock);
      this.playerBlock = Math.max(0, this.playerBlock - intent.damage);
      this.playerHp = Math.max(0, this.playerHp - hit);
      this.stats.damageTaken += hit;
      this.floaters.push({ x: 640, y: 560, text: `-${hit}`, color: '#ff6b5e', t: 0 });
      sfx.hurt();
      if (intent.block) {
        this.golemBlock += intent.block;
        msg = `Golem slams you for ${hit} and guards ${intent.block}.`;
      } else {
        msg = `Golem strikes you for ${hit}.`;
      }
    }
    this.log = msg;
    if (this.playerHp <= 0) return this.finish(false);
    // New turn.
    this.turn++;
    this.playerBlock = 0;
    this.mana = MAX_MANA;
    this.playedElements = [];
    this.drawCards(2);
    while (this.hand.length > HAND_SIZE) this.hand.pop();
    this.intent = chooseIntent(this.turn, this.rng, this.golemHp, GOLEM_MAX_HP);
    this.log += ` Turn ${this.turn} — ${this.intent.label}.`;
    return this.log;
  }

  finish(won) {
    this.screen = won ? 'win' : 'loss';
    this.stats.turns = this.turn;
    this.log = won
      ? `Victory! The Cinder Golem crumbles in ${this.turn} turns.`
      : 'Defeat. The golem\u2019s embers consume you.';
    if (won) sfx.win(); else sfx.lose();
    return this.log;
  }

  /** Final score: damage and play count, with a win bonus for speed. */
  get score() {
    const base = this.stats.damageDealt * 10 + this.stats.cardsPlayed * 15 + this.stats.healed * 5;
    return this.screen === 'win' ? base + Math.max(0, 500 - this.stats.turns * 20) : base;
  }

  // ---- scripted setups for screenshots / self-tests (deterministic states) ----

  /** A mid-battle table: full hands, readable values, intent and totals on show. */
  setupPlayShot() {
    this.reset();
    this.screen = 'play';
    this.turn = 3;
    this.mana = 2;
    this.playerHp = 24;
    this.playerBlock = 4;
    this.golemHp = 26;
    this.golemBlock = 3;
    this.golemStance = 'thorn';
    this.stats = { turns: 3, damageDealt: 14, cardsPlayed: 7, damageTaken: 6, healed: 0 };
    this.intent = { kind: 'strike', damage: 7, block: 0, label: 'Strike for 7' };
    const ids = ['ember-slash', 'tide-surge', 'thorn-whip', 'stone-guard', 'ember-burst'];
    this.hand = ids.map((id) => makeCard(id, this.uidCounter++));
    this.log = 'Turn 3 — the golem will Strike for 7. Thorn stance: Ember hits it for +3!';
  }

  /** A finished victory, with the stats a win screen must show. */
  setupWinShot() {
    this.reset();
    this.screen = 'win';
    this.turn = 6;
    this.playerHp = 17;
    this.golemHp = 0;
    this.stats = { turns: 6, damageDealt: 49, cardsPlayed: 14, damageTaken: 13, healed: 3 };
    this.log = 'Victory! The Cinder Golem crumbles in 6 turns.';
  }

  /** A finished defeat, with the stats a loss screen must show. */
  setupLossShot() {
    this.reset();
    this.screen = 'loss';
    this.turn = 7;
    this.playerHp = 0;
    this.golemHp = 15;
    this.stats = { turns: 7, damageDealt: 25, cardsPlayed: 11, damageTaken: 30, healed: 3 };
    this.log = 'Defeat. The golem\u2019s embers consume you.';
  }
}
