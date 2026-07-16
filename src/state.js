import { GATHER } from './config.js';

const state = {
  resource: 0,
  slots: [],
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

function notify() {
  for (const listener of listeners) listener(state);
}

export function addResource(amount) {
  state.resource += amount;
  notify();
}

export function setSlotStatus(index, status, startedAt = Date.now()) {
  const slot = state.slots[index];
  if (!slot) return;
  slot.status = status;
  slot.startedAt = startedAt;
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
