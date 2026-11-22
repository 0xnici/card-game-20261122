// input.js — mouse and keyboard play. Clicks are hit-tested against the layout
// render.js exports, so the buttons and cards the player sees are the ones that work.

import { cardRects, endTurnRect, titleButtonRect } from './render.js';

function pointIn(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function bindInput(canvas, game, onHover) {
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 1280;
    const py = ((e.clientY - r.top) / r.height) * 720;
    if (game.screen !== 'play') {
      onHover(-1);
      return;
    }
    const rects = cardRects(game);
    const i = rects.findIndex((c) => pointIn(px, py, c));
    onHover(i);
    canvas.style.cursor = i >= 0 || pointIn(px, py, endTurnRect()) ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 1280;
    const py = ((e.clientY - r.top) / r.height) * 720;
    if (game.screen === 'title') {
      if (pointIn(px, py, titleButtonRect())) game.startPlay();
      return;
    }
    if (game.screen === 'win' || game.screen === 'loss') return;
    const rects = cardRects(game);
    const i = rects.findIndex((c) => pointIn(px, py, c));
    if (i >= 0) {
      game.playCard(i);
      return;
    }
    if (pointIn(px, py, endTurnRect())) game.endTurn();
  });

  window.addEventListener('keydown', (e) => {
    if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
      game.startPlay();
      return;
    }
    if (game.screen === 'play') {
      if (e.key >= '1' && e.key <= '5') {
        game.playCard(Number(e.key) - 1);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        game.endTurn();
        return;
      }
    }
    if ((game.screen === 'win' || game.screen === 'loss') && (e.key === 'r' || e.key === 'R')) {
      game.startPlay();
      return;
    }
    if (e.key === 'Escape') {
      game.screen = 'title';
    }
  });
}
