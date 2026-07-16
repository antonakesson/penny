import { GATHER } from './config.js';
import { DEFAULT_ZONE_ID } from './zones.js';

const state = {
  slots: [],
  inventory: {},
  equipped: [],
};

const listeners = new Set();

function createSlot() {
  return { status: 'idle', startedAt: null, zoneId: DEFAULT_ZONE_ID, targetZoneId: null };
}

function reconcileSlots() {
  const { slotCount } = GATHER;
  while (state.slots.length < slotCount) state.slots.push(createSlot());
  if (state.slots.length > slotCount) state.slots.length = slotCount;

  // Patch slots loaded from saves that predate zoneId/targetZoneId —
  // Object.assign in loadState only merges top-level state, not the
  // shape of each saved slot.
  for (const slot of state.slots) {
    if (slot.zoneId === undefined) slot.zoneId = DEFAULT_ZONE_ID;
    if (slot.targetZoneId === undefined) slot.targetZoneId = null;
  }
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

export function setSlotStatus(index, status, startedAt = Date.now()) {
  const slot = state.slots[index];
  if (!slot) return;
  slot.status = status;
  slot.startedAt = startedAt;
  notify();
}

export function setSlotTargetZone(index, targetZoneId) {
  const slot = state.slots[index];
  if (!slot) return;
  slot.targetZoneId = targetZoneId;
  notify();
}

export function setSlotZone(index, zoneId) {
  const slot = state.slots[index];
  if (!slot) return;
  slot.zoneId = zoneId;
  slot.targetZoneId = null;
  notify();
}

export function addItem(itemId, amount) {
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) + amount;
  notify();
}

export function equip(itemId) {
  if (!state.equipped.includes(itemId)) state.equipped.push(itemId);
  notify();
}

export function unequip(itemId) {
  state.equipped = state.equipped.filter((id) => id !== itemId);
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
