import { actions } from './actions.js';
import { initRender } from './render.js';
import { loadSavedState } from './storage.js';

loadSavedState();

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = actions[target.dataset.action];
  if (action) action();
});

initRender();
