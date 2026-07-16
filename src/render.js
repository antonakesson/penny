import { subscribe, getState } from './state.js';
import { setText, qs, qsa } from './dom.js';
import { GATHER } from './config.js';
import { RESOURCE_LABEL, SLOT_LABEL, STATUS_LABEL } from './flavor.js';

export function initRender() {
  qs('#resource-label').textContent = RESOURCE_LABEL;
  buildSlots(getState());
  render(getState());
  subscribe(render);
}

function buildSlots(state) {
  const container = qs('#slots');
  container.innerHTML = '';
  state.slots.forEach((slot, i) => {
    const btn = document.createElement('button');
    btn.dataset.action = 'activate';
    btn.dataset.slot = String(i);
    btn.className = 'slot-btn';
    btn.innerHTML = `
      <span class="slot-label">${SLOT_LABEL(i)}</span>
      <span class="slot-status"></span>
      <span class="slot-progress"></span>
    `;
    container.appendChild(btn);
  });
}

function render(state) {
  setText('#resource-count', Math.floor(state.resource));

  for (const btn of qsa('.slot-btn')) {
    const slot = state.slots[Number(btn.dataset.slot)];
    if (!slot) continue;

    btn.classList.toggle('idle', slot.status === 'idle');
    btn.classList.toggle('active', slot.status === 'active');
    btn.classList.toggle('recovery', slot.status === 'recovery');
    btn.disabled = slot.status !== 'idle';

    setText('.slot-status', STATUS_LABEL[slot.status], btn);

    const total = slot.status === 'active' ? GATHER.activeMs : GATHER.recoveryMs;
    const pct = slot.status === 'idle' ? 0 : Math.min(100, ((Date.now() - slot.startedAt) / total) * 100);
    qs('.slot-progress', btn).style.setProperty('--pct', `${pct}%`);
  }
}
