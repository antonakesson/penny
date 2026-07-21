import { GATHER } from '../config.js';

const state = {
  slots: [],
  inventory: {},
  zones: { current: 'zone1', highestUnlocked: 'zone1' },
  monster: null, // live encounter instance — { id, level, hp, maxHp }
  xp: 0, // arbitrary accumulating number — no level curve consumes it yet
};

const listeners = new Set();

function createSlot() {
  return { status: 'idle', startedAt: null };
}

function reconcileSlots() {
  const { slotCount } = GATHER;
  while (state.slots.length < slotCount) state.slots.push(createSlot());
  if (state.slots.length > slotCount) state.slots.length = slotCount;
}

reconcileSlots();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Exported (rather than kept private) so domain-owner files elsewhere
// in state/ can notify after mutating their own slice directly.
export function notify() {
  for (const listener of listeners) listener(state);
}

export function setSlotStatus(index, status, startedAt = Date.now()) {
  const slot = state.slots[index];
  if (!slot) return;
  slot.status = status;
  slot.startedAt = startedAt;
  notify();
}

export function setMonster(monster) {
  state.monster = monster;
  notify();
}

export function damageMonster(amount) {
  if (!state.monster) return;
  state.monster.hp = Math.max(0, state.monster.hp - amount);
  notify();
}

export function addItem(itemId, amount) {
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) + amount;
  notify();
}

// Drives re-renders (e.g. progress bars) on ticks with no status change.
export function touch() {
  notify();
}

export function loadState(saved) {
  Object.assign(state, saved);
  reconcileSlots();
  notify();
}
