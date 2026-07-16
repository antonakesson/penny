import { actions } from './actions.js';
import { initRender } from './render.js';
import { loadSavedState } from './storage.js';
import { activateSlot, sailSlot, equipItem, unequipItem, craftItem, tick } from './engine.js';
import { on } from './events.js';
import { unlockAudio, playCoin } from './audio.js';

loadSavedState();

on('itemDropped', () => playCoin());

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  unlockAudio();

  const { action } = target.dataset;
  if (action === 'activate') {
    activateSlot(Number(target.dataset.slot));
    return;
  }
  if (action === 'equip') {
    equipItem(target.dataset.item);
    return;
  }
  if (action === 'unequip') {
    unequipItem(target.dataset.item);
    return;
  }
  if (action === 'craft') {
    craftItem(target.dataset.recipe);
    return;
  }

  const fn = actions[action];
  if (fn) fn();
});

document.addEventListener('change', (event) => {
  const target = event.target.closest('[data-action="sail"]');
  if (!target || !target.value) return;

  sailSlot(Number(target.dataset.slot), target.value);
  target.value = '';
});

setInterval(tick, 100);

initRender();
