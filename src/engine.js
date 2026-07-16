import { GATHER } from './config.js';
import { getState, setSlotStatus, addResource, touch } from './state.js';
import { emit } from './events.js';

export function activateSlot(index) {
  const slot = getState().slots[index];
  if (!slot || slot.status !== 'idle') return;
  setSlotStatus(index, 'active');
  emit('slotActivated', { index });
}

export function tick() {
  const now = Date.now();
  getState().slots.forEach((slot, i) => {
    if (slot.status === 'active' && now - slot.startedAt >= GATHER.activeMs) {
      resolveSlot(i);
    } else if (slot.status === 'recovery' && now - slot.startedAt >= GATHER.recoveryMs) {
      setSlotStatus(i, 'idle', null);
    }
  });
  touch();
}

function resolveSlot(index) {
  let amount = 0;
  if (Math.random() < GATHER.successChance) {
    const roll = GATHER.yieldMin + Math.random() * (GATHER.yieldMax - GATHER.yieldMin);
    amount = Math.round(roll * GATHER.yieldMultiplier);
    addResource(amount);
  }
  setSlotStatus(index, 'recovery');
  emit('slotResolved', { index, amount });
}
