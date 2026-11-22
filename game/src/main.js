// main.js — boot: wire the canvas, the game, input and the render loop, then
// honour the URL modes the maker uses for screenshots and self-tests:
//   ?shot=title|play|win|loss&seed=N   stage a deterministic state and render it
//   ?selftest=play|win|loss            play the game headlessly and report the result
//                                      in #test-result (and document.title) for the harness

import { Game } from './game.js';
import { draw, W, H } from './render.js';
import { bindInput } from './input.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = new Game(Number(params.get('seed') ?? 20261122));
let hoverIndex = -1;

bindInput(canvas, game, (i) => { hoverIndex = i; });

window.__emberfall = game;

window.addEventListener('error', (e) => {
  const el = document.getElementById('test-result');
  if (el) el.textContent = JSON.stringify({ ok: false, error: String(e.message || e.error) });
});

function stageShot(shot) {
  if (shot === 'play') game.setupPlayShot();
  else if (shot === 'win') game.setupWinShot();
  else if (shot === 'loss') game.setupLossShot();
  else game.screen = 'title';
}

/** Headless self-test: play scripted games and report win / loss / play states. */
function runSelfTest(kind) {
  const out = { kind, ok: false };
  try {
    if (kind === 'play') {
      game.startPlay();
      out.ok = game.screen === 'play' && game.hand.length === 5 && game.mana === 3;
      out.screen = game.screen;
      out.hand = game.hand.length;
      out.mana = game.mana;
    } else if (kind === 'win') {
      game.startPlay();
      let guard = 0;
      while (game.screen === 'play' && guard++ < 60) {
        // Play every damage card we can afford, then end the turn.
        let played = true;
        while (played) {
          played = false;
          for (let i = 0; i < game.hand.length; i++) {
            const c = game.hand[i];
            if ((c.damage ?? 0) > 0 && game.canPlay(c)) {
              game.playCard(i);
              played = true;
              break;
            }
          }
        }
        if (game.screen === 'play') game.endTurn();
      }
      out.ok = game.screen === 'win';
      out.screen = game.screen;
      out.turns = game.stats.turns;
      out.score = game.score;
    } else if (kind === 'loss') {
      game.startPlay();
      let guard = 0;
      while (game.screen === 'play' && guard++ < 60) game.endTurn();
      out.ok = game.screen === 'loss';
      out.screen = game.screen;
      out.turns = game.stats.turns;
    } else {
      out.error = `unknown selftest ${kind}`;
    }
  } catch (err) {
    out.error = String(err && err.message ? err.message : err);
  }
  const el = document.getElementById('test-result');
  if (el) el.textContent = JSON.stringify(out);
  document.title = `selftest:${JSON.stringify(out)}`;
  return out;
}

const shot = params.get('shot');
const selftest = params.get('selftest');
if (selftest) {
  runSelfTest(selftest);
} else if (shot) {
  stageShot(shot);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(100, now - last);
  last = now;
  for (const f of game.floaters) f.t += dt;
  game.floaters = game.floaters.filter((f) => f.t < 900);
  draw(ctx, game, now, hoverIndex);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
