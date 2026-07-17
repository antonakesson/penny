import { subscribe, getState } from './state.js';
import { setText, qs, qsa } from './dom.js';
import { GATHER } from './config.js';
import {
  INVENTORY_LABEL,
  EQUIPPED_LABEL,
  STATS_TITLE,
  CRAFT_LABEL,
  SLOT_LABEL,
  STATUS_LABEL,
} from './flavor.js';
import { ZONES, ZONE_LIST } from './zones.js';
import { ITEMS } from './items.js';
import { RECIPES } from './recipes.js';
import { findRoute } from './travel.js';
import { getEquippedStats } from './stats.js';
import { canCraft } from './engine.js';
import { on } from './events.js';

export function initRender() {
  qs('#inventory-label').textContent = INVENTORY_LABEL;
  qs('#equipped-label').textContent = EQUIPPED_LABEL;
  qs('#stats-label').textContent = STATS_TITLE;
  qs('#craft-label').textContent = CRAFT_LABEL;
  buildSlots(getState());
  render(getState());
  subscribe(render);
  on('itemUsed', ({ message }) => setText('#status-message', message));
}

function buildSlots(state) {
  const container = qs('#slots');
  container.innerHTML = '';
  state.slots.forEach((slot, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'slot';
    wrapper.dataset.slot = String(i);

    const btn = document.createElement('button');
    btn.dataset.action = 'activate';
    btn.dataset.slot = String(i);
    btn.className = 'slot-btn';
    btn.innerHTML = `
      <span class="slot-header">
        <span class="slot-label">${SLOT_LABEL(i)}</span>
        <span class="slot-timer"></span>
      </span>
      <span class="slot-zone"></span>
      <span class="slot-status"></span>
      <span class="slot-progress"></span>
    `;

    const select = document.createElement('select');
    select.dataset.action = 'sail';
    select.dataset.slot = String(i);
    select.className = 'slot-travel';
    // Cost/time depend on where this net currently is, so labels are
    // filled in by render() rather than baked in here.
    select.innerHTML =
      `<option value="">Swim to…</option>` + ZONE_LIST.map((zone) => `<option value="${zone.id}">${zone.name}</option>`).join('');

    wrapper.append(btn, select);
    container.appendChild(wrapper);
  });
}

function formatDuration(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function render(state) {
  renderInventory(state);
  renderEquipped(state);
  renderCraft(state);

  for (const wrapper of qsa('.slot')) {
    const slot = state.slots[Number(wrapper.dataset.slot)];
    if (!slot) continue;

    const btn = qs('.slot-btn', wrapper);
    const select = qs('.slot-travel', wrapper);
    const zone = ZONES[slot.zoneId];

    btn.classList.toggle('idle', slot.status === 'idle');
    btn.classList.toggle('active', slot.status === 'active');
    btn.classList.toggle('recovery', slot.status === 'recovery');
    btn.classList.toggle('sailing', slot.status === 'sailing');
    btn.classList.toggle('crafting', slot.status === 'crafting');
    btn.disabled = slot.status !== 'idle';

    setText('.slot-zone', zone ? zone.name : '—', btn);
    setText(
      '.slot-status',
      slot.status === 'crafting' ? `Crafting ${ITEMS[slot.craftRecipeId]?.name ?? '…'}` : STATUS_LABEL[slot.status],
      btn
    );

    let total = GATHER.activeMs;
    if (slot.status === 'recovery') total = GATHER.recoveryMs;
    if (slot.status === 'sailing') total = findRoute(slot.zoneId, slot.targetZoneId)?.timeMs ?? 0;
    if (slot.status === 'crafting') total = RECIPES[slot.craftRecipeId]?.craftMs ?? 0;

    const rawPct =
      slot.status === 'idle' ? 0 : total === 0 ? 100 : Math.min(100, ((Date.now() - slot.startedAt) / total) * 100);
    // Recovery reads as draining stamina rather than building progress —
    // starts full, empties out as the cooldown elapses.
    const pct = slot.status === 'recovery' ? 100 - rawPct : rawPct;
    qs('.slot-progress', btn).style.setProperty('--pct', `${pct}%`);

    const remainingMs = slot.status === 'idle' ? 0 : Math.max(0, total - (Date.now() - slot.startedAt));
    setText('.slot-timer', slot.status === 'idle' ? '' : formatDuration(remainingMs), btn);

    select.disabled = slot.status !== 'idle';
    for (const option of select.options) {
      if (!option.value) continue; // placeholder
      const targetZone = ZONES[option.value];
      const route = option.value === slot.zoneId ? null : findRoute(slot.zoneId, option.value);
      option.disabled = option.value === slot.zoneId || !route;
      option.textContent = route ? `${targetZone.name} (${route.timeMs / 1000}s)` : `${targetZone.name}`;
    }
  }
}

// tick() re-renders every 100ms so slot progress bars can animate, but
// that would otherwise also tear down/rebuild these buttons on every
// tick (even when inventory/recipes haven't changed) — new DOM nodes
// under the cursor re-trigger :hover, which read as flashing borders.
// Skip the rebuild unless the relevant state actually changed.
let inventorySignature = null;
let craftSignature = null;

function renderInventory(state) {
  const signature = JSON.stringify([state.inventory, state.equipped]);
  if (signature === inventorySignature) return;
  inventorySignature = signature;

  const container = qs('#inventory-list');
  const entries = Object.entries(state.inventory).filter(([, count]) => count > 0);

  if (!entries.length) {
    container.textContent = '—';
    return;
  }

  container.innerHTML = '';
  for (const [itemId, count] of entries) {
    const item = ITEMS[itemId];
    if (!item) continue;

    const row = document.createElement('div');
    row.className = 'inventory-row';
    row.title = item.description ? `${item.name}\n${item.description}` : item.name;

    const header = document.createElement('div');
    header.className = 'inventory-header';

    const name = document.createElement('span');
    name.className = 'inventory-name';
    name.textContent = item.name;
    header.appendChild(name);

    const stack = document.createElement('span');
    stack.className = 'inventory-count';
    stack.textContent = `x${count}`;
    header.appendChild(stack);

    row.appendChild(header);

    if (item.description) {
      const desc = document.createElement('div');
      desc.className = 'inventory-desc';
      desc.textContent = item.description;
      row.appendChild(desc);
    }

    const actions = document.createElement('div');
    actions.className = 'inventory-actions';

    if (item.onUseEffect) {
      const btn = document.createElement('button');
      btn.className = 'inventory-equip-btn';
      btn.dataset.action = 'use';
      btn.dataset.item = itemId;
      btn.textContent = 'Use';
      actions.appendChild(btn);
    }

    if (item.stats) {
      const equipped = state.equipped.includes(itemId);
      const btn = document.createElement('button');
      btn.className = 'inventory-equip-btn';
      btn.dataset.action = equipped ? 'unequip' : 'equip';
      btn.dataset.item = itemId;
      btn.textContent = equipped ? 'Unequip' : 'Equip';
      actions.appendChild(btn);
    }

    row.appendChild(actions);
    container.appendChild(row);
  }
}

function renderEquipped(state) {
  setText('#equipped-list', state.equipped.length ? state.equipped.map((id) => ITEMS[id]?.name ?? id).join(', ') : '—');

  const stats = getEquippedStats(state);
  const statEntries = Object.entries(stats);
  // Assumes fractional (percentage-style) stat values — the only kind
  // that exist right now.
  setText(
    '#stats-list',
    statEntries.length ? statEntries.map(([key, value]) => `${key} +${Math.round(value * 100)}%`).join(', ') : '—'
  );
}

function renderCraft(state) {
  const signature = JSON.stringify(state.inventory);
  if (signature === craftSignature) return;
  craftSignature = signature;

  const container = qs('#craft-list');
  container.innerHTML = '';

  for (const [recipeId, recipe] of Object.entries(RECIPES)) {
    const item = ITEMS[recipeId];
    if (!item) continue;

    const row = document.createElement('div');
    row.className = 'craft-row';

    const name = document.createElement('div');
    name.className = 'craft-name';
    name.textContent = item.name;

    const cost = document.createElement('div');
    cost.className = 'craft-cost';
    cost.textContent = Object.entries(recipe.inputs)
      .map(([itemId, qty]) => `${ITEMS[itemId]?.name ?? itemId} ${state.inventory[itemId] ?? 0}/${qty}`)
      .join(', ');

    const btn = document.createElement('button');
    btn.className = 'craft-btn';
    btn.dataset.action = 'craft';
    btn.dataset.recipe = recipeId;
    btn.disabled = !canCraft(recipeId, state);
    btn.textContent = 'Craft';

    row.append(name, cost, btn);
    container.appendChild(row);
  }
}
