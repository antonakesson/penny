// Dev-only tool: spawn items, skip timers, and edit raw state without
// hours of farming. Not wired into the data-action click router in
// main.js on purpose — this builds and owns its own DOM/listeners so it
// stays isolated from real game UI code.
import { getState, loadState, addItem, subscribe, touch } from './state.js';
import { ITEMS } from './items.js';

export function initDebug() {
  const panel = buildPanel();
  document.body.appendChild(panel);

  const toggle = document.createElement('button');
  toggle.id = 'debug-toggle';
  toggle.textContent = 'Debug';
  toggle.addEventListener('click', () => panel.classList.toggle('open'));
  document.body.appendChild(toggle);

  const textarea = panel.querySelector('#debug-json');
  const refresh = () => {
    if (document.activeElement === textarea) return; // don't clobber an in-progress edit
    textarea.value = JSON.stringify(getState(), null, 2);
  };
  refresh();
  subscribe(refresh);
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-panel';

  const itemRow = document.createElement('div');
  itemRow.className = 'debug-row';

  const select = document.createElement('select');
  select.id = 'debug-item-select';
  select.innerHTML = Object.entries(ITEMS)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(([id, item]) => `<option value="${id}">${item.name}</option>`)
    .join('');

  const qty = document.createElement('input');
  qty.type = 'number';
  qty.id = 'debug-item-qty';
  qty.value = '1';
  qty.min = '1';

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add item';
  addBtn.addEventListener('click', () => {
    addItem(select.value, Number(qty.value) || 1);
  });

  itemRow.append(select, qty, addBtn);

  const finishBtn = document.createElement('button');
  finishBtn.textContent = 'Finish all timers';
  finishBtn.addEventListener('click', () => {
    for (const slot of getState().slots) {
      if (slot.status !== 'idle') slot.startedAt = 0;
    }
    touch();
  });

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear inventory';
  clearBtn.addEventListener('click', () => {
    getState().inventory = {};
    touch();
  });

  const textarea = document.createElement('textarea');
  textarea.id = 'debug-json';
  textarea.spellcheck = false;

  const jsonError = document.createElement('div');
  jsonError.id = 'debug-json-error';

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply JSON';
  applyBtn.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(textarea.value);
      loadState(parsed);
      jsonError.textContent = '';
    } catch (err) {
      jsonError.textContent = err.message;
    }
  });

  panel.append(itemRow, finishBtn, clearBtn, textarea, applyBtn, jsonError);
  return panel;
}
