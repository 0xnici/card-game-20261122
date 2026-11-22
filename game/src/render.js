// render.js — every pixel of Emberfall Duel on one 1280x720 canvas: the felt
// table, the golem, the two hands, the cards, the totals and the end screens.
// Colours and shapes carry the elements, never text alone.

import { ELEMENTS, beats } from './cards.js';
import { GOLEM_MAX_HP, PLAYER_MAX_HP } from './game.js';

export const W = 1280;
export const H = 720;

const CARD_W = 150;
const CARD_H = 210;

/** Hand layout: five cards fanned across the bottom of the table. */
export function cardRects(game) {
  const n = game.hand.length;
  const gap = 14;
  const total = n * CARD_W + (n - 1) * gap;
  const x0 = (W - total) / 2;
  return game.hand.map((card, i) => ({
    card,
    x: x0 + i * (CARD_W + gap),
    y: 478,
    w: CARD_W,
    h: CARD_H,
    hover: false,
  }));
}

export function endTurnRect() {
  return { x: 1060, y: 600, w: 180, h: 56 };
}

export function titleButtonRect() {
  return { x: 490, y: 470, w: 300, h: 64 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTable(ctx) {
  const g = ctx.createRadialGradient(640, 340, 80, 640, 360, 820);
  g.addColorStop(0, '#1e4a2e');
  g.addColorStop(0.6, '#173d24');
  g.addColorStop(1, '#0e2416');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(640, 360, 600, 330, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,162,39,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(640, 360, 560, 300, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBar(ctx, x, y, w, h, frac, fill, label) {
  ctx.fillStyle = '#101010';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fill;
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, Math.max(8, (w - 4) * Math.min(1, frac)), h - 4, (h - 4) / 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
}

function drawMana(ctx, mana, max) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8e0c8';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('MANA', 60, 700);
  for (let i = 0; i < max; i++) {
    ctx.beginPath();
    ctx.arc(140 + i * 34, 700, 12, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? '#4db2ff' : '#233044';
    ctx.fill();
    ctx.strokeStyle = '#8ec8ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/** The element glyph: flame, droplet, leaf or rock — drawn, never an emoji. */
function drawGlyph(ctx, glyph, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  if (glyph === 'flame') {
    ctx.moveTo(0, -22);
    ctx.bezierCurveTo(14, -6, 18, 4, 10, 16);
    ctx.bezierCurveTo(4, 24, -8, 24, -12, 14);
    ctx.bezierCurveTo(-18, 2, -8, -8, 0, -22);
  } else if (glyph === 'drop') {
    ctx.moveTo(0, -22);
    ctx.bezierCurveTo(14, -2, 16, 8, 8, 16);
    ctx.bezierCurveTo(0, 22, -8, 16, -8, 8);
    ctx.bezierCurveTo(-8, -2, -6, -8, 0, -22);
  } else if (glyph === 'leaf') {
    ctx.moveTo(0, -20);
    ctx.bezierCurveTo(18, -10, 18, 12, 0, 20);
    ctx.bezierCurveTo(-18, 12, -18, -10, 0, -20);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 18);
  } else {
    ctx.moveTo(-18, 12);
    ctx.lineTo(-10, -12);
    ctx.lineTo(8, -16);
    ctx.lineTo(18, 6);
    ctx.lineTo(8, 16);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

/** One card face: cost gem, element band, glyph, name, rules text, damage preview. */
export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.element];
  const dim = opts.disabled;
  ctx.save();
  if (opts.hover) {
    ctx.translate(0, -14);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
  }
  ctx.globalAlpha = dim ? 0.45 : 1;
  ctx.fillStyle = '#f5eeda';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = el.color;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Element band.
  ctx.fillStyle = el.color;
  roundRect(ctx, x + 6, y + 6, w - 12, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name.toUpperCase(), x + w / 2, y + 22);
  // Cost gem.
  ctx.beginPath();
  ctx.arc(x + 24, y + 56, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#2f7fd0';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(String(card.cost), x + 24, y + 57);
  // Glyph art.
  drawGlyph(ctx, el.glyph, x + w / 2 + 12, y + 96, 1.5, el.color);
  // Name.
  ctx.fillStyle = '#221a10';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(card.name, x + w / 2, y + 148);
  // Rules text.
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#4a3f2a';
  wrapText(ctx, card.text, x + w / 2, y + 164, w - 18, 16);
  // Damage preview, when the card would hit now (wrapText leaves baseline 'top'; reset it).
  // Right-aligned in the bottom corner so a two-line rules text never touches it.
  if (opts.damage !== undefined && opts.damage > 0) {
    ctx.fillStyle = '#b3261e';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`ATK ${opts.damage}`, x + w - 10, y + h - 10);
  }
  ctx.restore();
}

/** A face-down card back for the golem's hand. */
function drawCardBack(ctx, x, y, w, h) {
  ctx.fillStyle = '#3a2a1a';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawGlyph(ctx, 'flame', x + w / 2, y + h / 2, 1.1, '#c9a227');
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lh));
}

function drawGolem(ctx, game, time) {
  const bob = Math.sin(time / 500) * 3;
  const cx = 640;
  const cy = 118 + bob;
  // Body: stacked stone slabs with ember cracks.
  ctx.fillStyle = '#4a4238';
  roundRect(ctx, cx - 58, cy - 22, 116, 88, 16);
  ctx.fill();
  ctx.fillStyle = '#5d5346';
  roundRect(ctx, cx - 46, cy - 46, 92, 40, 14);
  ctx.fill();
  ctx.fillStyle = '#e8542f';
  ctx.beginPath();
  ctx.arc(cx - 18, cy - 28, 6, 0, Math.PI * 2);
  ctx.arc(cx + 18, cy - 28, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffb37a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 8);
  ctx.lineTo(cx - 8, cy + 24);
  ctx.lineTo(cx + 6, cy + 10);
  ctx.lineTo(cx + 20, cy + 26);
  ctx.stroke();
  // Name + stance badge.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CINDER GOLEM', cx, 34);
  const stance = ELEMENTS[game.golemStance];
  ctx.fillStyle = stance.color;
  roundRect(ctx, cx - 110, 42, 220, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`STANCE: ${stance.name.toUpperCase()}`, cx, 59);
}

function drawEnemyHand(ctx, game) {
  for (let i = 0; i < 5; i++) {
    drawCardBack(ctx, 470 + i * 62, 216, 52, 74);
  }
  ctx.fillStyle = '#e8e0c8';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Golem\u2019s hand (hidden)', 470, 308);
}

function drawIntent(ctx, game) {
  const intent = game.intent;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, 940, 96, 300, 74, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('GOLEM INTENDS', 956, 118);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText(intent.label, 956, 146);
}

function drawPlay(ctx, game, time, hoverIndex) {
  drawTable(ctx);
  drawGolem(ctx, game, time);
  drawEnemyHand(ctx, game);
  drawIntent(ctx, game);
  // Totals: golem HP + block, player HP + block.
  drawBar(ctx, 420, 322, 440, 26, game.golemHp / GOLEM_MAX_HP, '#c0392b', `GOLEM  ${game.golemHp} / ${GOLEM_MAX_HP}${game.golemBlock ? `  (+${game.golemBlock} block)` : ''}`);
  drawBar(ctx, 420, 428, 440, 26, game.playerHp / PLAYER_MAX_HP, '#27ae60', `YOU  ${game.playerHp} / ${PLAYER_MAX_HP}${game.playerBlock ? `  (+${game.playerBlock} block)` : ''}`);
  // Turn + deck counts.
  ctx.fillStyle = '#e8e0c8';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`TURN ${game.turn}`, 60, 60);
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Deck: ${game.pile.drawCount}   Discard: ${game.pile.discardCount}`, 60, 88);
  ctx.fillText(`Score: ${game.score}`, 60, 116);
  // Log line.
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.log, 640, 384);
  // Advantage hint.
  ctx.fillStyle = '#b8ac8a';
  ctx.font = '15px Georgia, serif';
  const weak = Object.keys(ELEMENTS).filter((e) => beats(e, game.golemStance));
  ctx.fillText(`Ember beats Thorn · Thorn beats Tide · Tide beats Ember — ${weak.length ? ELEMENTS[weak[0]].name + ' is strong now' : 'Stone is neutral'}`, 640, 406);
  // Player hand.
  const rects = cardRects(game);
  rects.forEach((r, i) => {
    drawCard(ctx, r.card, r.x, r.y, r.w, r.h, {
      hover: i === hoverIndex,
      disabled: !game.canPlay(r.card),
      damage: game.cardDamage(r.card),
    });
  });
  // End Turn button.
  const b = endTurnRect();
  ctx.fillStyle = '#c9a227';
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.fillStyle = '#221a10';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN ⏎', b.x + b.w / 2, b.y + b.h / 2 + 1);
  drawMana(ctx, game.mana, 3);
  // Floaters.
  ctx.textAlign = 'center';
  game.floaters.forEach((f) => {
    ctx.globalAlpha = Math.max(0, 1 - f.t / 900);
    ctx.fillStyle = f.color;
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText(f.text, f.x, f.y - f.t / 18);
  });
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, game, time) {
  drawTable(ctx);
  // Decorative fan of cards behind the title.
  const fan = ['ember-burst', 'tide-surge', 'thorn-snare', 'stone-slam', 'boulder-toss'];
  fan.forEach((id, i) => {
    const def = { id, name: '', element: id.split('-')[0] === 'boulder' ? 'stone' : id.split('-')[0], cost: 2, damage: 8, text: '' };
    ctx.save();
    ctx.translate(640 + (i - 2) * 130, 300);
    ctx.rotate((i - 2) * 0.12 + Math.sin(time / 900) * 0.02);
    drawCard(ctx, def, -75, -105, 150, 210, {});
    ctx.restore();
  });
  ctx.fillStyle = 'rgba(10,16,12,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('EMBERFALL', 640, 210);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.fillText('DUEL', 640, 290);
  ctx.fillStyle = '#e8e0c8';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('A deck-builder card battler against the Cinder Golem', 640, 340);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = '#b8ac8a';
  ctx.fillText('Build your hand. Match the golem\u2019s stance. Break its guard before it breaks you.', 640, 372);
  ctx.fillText('Ember beats Thorn · Thorn beats Tide · Tide beats Ember · Stone stands alone', 640, 400);
  const b = titleButtonRect();
  const pulse = 0.85 + Math.sin(time / 400) * 0.15;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#c9a227';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#221a10';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶  PLAY', b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#b8ac8a';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Click PLAY or press ENTER · 1–5 play a card · ENTER ends your turn', 640, 580);
}

function drawEnd(ctx, game, won) {
  drawTable(ctx);
  ctx.fillStyle = won ? 'rgba(20,40,10,0.72)' : 'rgba(40,8,8,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd34d' : '#ff6b5e';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', 640, 220);
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText(won ? 'The Cinder Golem crumbles into cold stone.' : 'The golem\u2019s embers consume you.', 640, 268);
  // Stats panel.
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, 440, 300, 400, 190, 14);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();
  const s = game.stats;
  const rows = [
    `Score: ${game.score}`,
    `Turns: ${s.turns}`,
    `Damage dealt: ${s.damageDealt}`,
    `Cards played: ${s.cardsPlayed}`,
    `Damage taken: ${s.damageTaken}`,
  ];
  ctx.fillStyle = '#e8e0c8';
  ctx.font = '20px Georgia, serif';
  rows.forEach((row, i) => ctx.fillText(row, 640, 340 + i * 30));
  ctx.fillStyle = '#b8ac8a';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Press R to play again · Esc for the title screen', 640, 540);
}

/** Draw the whole game for the current screen. `time` is the animation clock (ms). */
export function draw(ctx, game, time, hoverIndex = -1) {
  ctx.clearRect(0, 0, W, H);
  if (game.screen === 'title') drawTitle(ctx, game, time);
  else if (game.screen === 'play') drawPlay(ctx, game, time, hoverIndex);
  else if (game.screen === 'win') drawEnd(ctx, game, true);
  else drawEnd(ctx, game, false);
}
