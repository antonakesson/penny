import { actions } from './actions.js';
import { initRender } from './render.js';
import { loadSavedState } from './storage.js';
import { activateSlot, tick } from './engine.js';
import { on } from './events.js';
import { unlockAudio, playCoin } from './audio.js';

loadSavedState();

on('slotResolved', ({ amount }) => {
  if (amount > 0) playCoin();
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  unlockAudio();

  const { action } = target.dataset;
  if (action === 'activate') {
    activateSlot(Number(target.dataset.slot));
    return;
  }

  const fn = actions[action];
  if (fn) fn();
});

setInterval(tick, 100);

initRender();
