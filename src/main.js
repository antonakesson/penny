import { actions } from './actions.js';
import { initRender } from './ui/render.js';
import { loadSavedState } from './storage.js';
import { activateSlot, tick, ensureMonster } from './core/engine.js';
import { on } from './events.js';
import { unlockAudio, playCoin, playWoop } from './ui/audio.js';

loadSavedState();
ensureMonster();

on('itemDropped', () => playCoin());
on('slotFailed', () => playWoop());

// Whole page is the attack button — the slot below is feedback only.
// Anything with its own data-action (currently just Save) opts out of
// that and runs its own action instead.
document.addEventListener('click', (event) => {
  unlockAudio();

  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) {
    const fn = actions[actionTarget.dataset.action];
    if (fn) fn();
    return;
  }

  activateSlot(0);
});

setInterval(tick, 100);

initRender();
