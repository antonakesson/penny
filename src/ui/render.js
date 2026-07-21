import { subscribe, getState } from '../state/state.js';
import { setText, qs, qsa } from './dom.js';
import { GATHER } from '../config.js';
import { SLOT_LABEL, STATUS_LABEL, MISS_MESSAGE } from './flavor.js';
import { ITEMS, ITEM_RARITY } from '../data/loot.js';
import { MONSTERS } from '../data/monstats.js';
import { ZONES } from '../data/zones.js';
import { on } from '../events.js';
import { spawnFloatingText } from './floatingText.js';

export function initRender() {
  buildZone();
  buildEnemy();
  buildSlots(getState());
  render(getState());
  subscribe(render);
  on('itemDropped', ({ index, itemId }) =>
    spawnFloatingText(slotEl(index), `+1 ${ITEMS[itemId]?.name ?? itemId}`, 'loot', rarityClass(itemId))
  );
  on('slotFailed', ({ index }) => spawnFloatingText(slotEl(index), MISS_MESSAGE, 'miss'));
  on('monsterHit', ({ damage }) => spawnFloatingText('#enemy', `-${damage}`, 'damage'));
}

// 'common' (the default when an item has no ITEM_RARITY entry) has no
// CSS class of its own — it's the unstyled look, so this returns ''.
function rarityClass(itemId) {
  const tier = ITEM_RARITY[itemId];
  return tier && tier !== 'common' ? `rarity-${tier}` : '';
}

function slotEl(index) {
  return qs(`.slot[data-slot="${index}"]`);
}

function buildZone() {
  const container = qs('#zone');
  container.innerHTML = `<div class="zone-name"></div>`;
}

function renderZone(state) {
  const zone = ZONES[state.zones.current];
  setText('.zone-name', zone?.name ?? state.zones.current, qs('#zone'));
}

function buildEnemy() {
  const container = qs('#enemy');
  container.innerHTML = `
    <div class="enemy-header">Lv <span class="enemy-level"></span> <span class="enemy-name"></span></div>
    <div class="enemy-hp-bar"><div class="enemy-hp-fill"></div></div>
    <div class="enemy-hp-text"></div>
  `;
}

function renderEnemy(state) {
  const monster = state.monster;
  const container = qs('#enemy');
  if (!monster) {
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  const def = MONSTERS[monster.id];
  setText('.enemy-level', `${monster.level}`, container);
  setText('.enemy-name', def?.name ?? monster.id, container);

  const pct = monster.maxHp === 0 ? 0 : Math.max(0, Math.min(100, (monster.hp / monster.maxHp) * 100));
  qs('.enemy-hp-fill', container).style.setProperty('--pct', `${pct}%`);
  setText('.enemy-hp-text', `${monster.hp}/${monster.maxHp}`, container);
}

function buildSlots(state) {
  const container = qs('#slots');
  container.innerHTML = '';
  state.slots.forEach((slot, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'slot';
    wrapper.dataset.slot = String(i);

    // Feedback only, not clickable — the whole page is the attack
    // button now (main.js), this just displays the swing/cooldown.
    const btn = document.createElement('div');
    btn.className = 'slot-btn';
    btn.innerHTML = `
      <span class="slot-header">
        <span class="slot-label">${SLOT_LABEL(i)}</span>
        <span class="slot-timer"></span>
      </span>
      <span class="slot-status"></span>
      <span class="slot-progress"></span>
    `;

    wrapper.append(btn);
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
  renderZone(state);
  renderEnemy(state);
  setText('#xp-tally', `XP ${state.xp}`);

  for (const wrapper of qsa('.slot')) {
    const slot = state.slots[Number(wrapper.dataset.slot)];
    if (!slot) continue;

    const btn = qs('.slot-btn', wrapper);

    btn.classList.toggle('idle', slot.status === 'idle');
    btn.classList.toggle('active', slot.status === 'active');
    btn.classList.toggle('recovery', slot.status === 'recovery');

    setText('.slot-status', STATUS_LABEL[slot.status], btn);

    const total = slot.status === 'recovery' ? GATHER.recoveryMs : GATHER.activeMs;

    const rawPct =
      slot.status === 'idle' ? 0 : total === 0 ? 100 : Math.min(100, ((Date.now() - slot.startedAt) / total) * 100);
    // Recovery reads as draining stamina rather than building progress —
    // start full, empty out as the cooldown elapses.
    const pct = slot.status === 'recovery' ? 100 - rawPct : rawPct;
    qs('.slot-progress', btn).style.setProperty('--pct', `${pct}%`);

    const remainingMs = slot.status === 'idle' ? 0 : Math.max(0, total - (Date.now() - slot.startedAt));
    setText('.slot-timer', slot.status === 'idle' ? '' : formatDuration(remainingMs), btn);
  }
}

