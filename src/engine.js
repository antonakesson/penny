import { GATHER } from './config.js';
import { getState, setSlotStatus, addItem, touch, setMonster, damageMonster } from './state.js';
import { emit } from './events.js';
import { resolveDropId } from './loot.js';
import { ZONES } from './zones.js';
import { MONSTERS } from './monstats.js';

// Spawns a monster into state.monster only if one isn't already
// live — safe to call unconditionally at startup, whether this is a
// fresh game or a reload mid-encounter.
export function ensureMonster() {
  if (!getState().monster) spawnMonster();
}

function spawnMonster() {
  const zone = ZONES[getState().zones.current];
  const monsterId = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
  const base = MONSTERS[monsterId];
  const level = zone.monsterLevel;
  const hp = base.hp + base.hpPerLevel * (level - 1);
  setMonster({ id: monsterId, level, hp, maxHp: hp });
}

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
  if (rollActionSuccess()) {
    const damage = attackDamage();
    damageMonster(damage);
    emit('monsterHit', { index, damage });
    if (getState().monster.hp <= 0) resolveMonsterKill(index);
  } else {
    emit('slotFailed', { index });
  }

  setSlotStatus(index, 'recovery');
  emit('slotResolved', { index });
}

function resolveMonsterKill(index) {
  const monster = getState().monster;
  const itemId = resolveDropId(MONSTERS[monster.id].drop);
  if (itemId) {
    addItem(itemId, 1);
    emit('itemDropped', { index, itemId });
  }
  emit('monsterKilled', { index, monsterId: monster.id });
  spawnMonster();
}

// Gates whether an attack lands at all.
function rollActionSuccess() {
  return Math.random() < successChance();
}

// PLACEHOLDER: flat 50/50 for now. Future system under development.
function successChance() {
  return 0.5;
}

// PLACEHOLDER: flat unarmed damage. Real system (talents, stats,
// equipment, resistances/weaknesses) later.
function attackDamage() {
  return 1;
}
