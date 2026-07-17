import { GATHER } from './config.js';
import {
  getState,
  setSlotStatus,
  setSlotZone,
  setSlotTargetZone,
  setSlotCraftRecipe,
  addItem,
  equip,
  unequip,
  touch,
} from './state.js';
import { emit } from './events.js';
import { ZONES } from './zones.js';
import { findRoute } from './travel.js';
import { TREASURE_CLASSES } from './treasureClasses.js';
import { ITEMS } from './items.js';
import { RECIPES } from './recipes.js';
import { EQUIPMENT } from './config.js';
import { EFFECTS } from './effects.js';

const MAX_DROP_DEPTH = 8; // guards a cyclic treasure-class reference

// Crafting uses your hands, same as rummaging — it claims the self
// slot rather than running as an independent parallel process. Only
// one slot exists at all until FEATURE_SLOTS_UPGRADE.md's self/tool
// split lands; slot 0 is that self slot in the meantime.
const SELF_SLOT_INDEX = 0;

export function activateSlot(index) {
  const slot = getState().slots[index];
  if (!slot || slot.status !== 'idle') return;
  setSlotStatus(index, 'active');
  emit('slotActivated', { index });
}

export function sailSlot(index, targetZoneId) {
  const state = getState();
  const slot = state.slots[index];
  if (!slot || slot.status !== 'idle' || !ZONES[targetZoneId] || targetZoneId === slot.zoneId) return;

  const route = findRoute(slot.zoneId, targetZoneId);
  if (!route) return;

  setSlotTargetZone(index, targetZoneId);
  setSlotStatus(index, 'sailing');
  emit('slotSailing', { index, targetZoneId, route });
}

export function equipItem(itemId) {
  const state = getState();
  const item = ITEMS[itemId];
  if (!item?.stats) return; // not gear
  if (!state.inventory[itemId]) return; // must own at least one
  if (state.equipped.includes(itemId)) return;
  if (state.equipped.length >= EQUIPMENT.slots) return;

  equip(itemId);
  emit('itemEquipped', { itemId });
}

export function unequipItem(itemId) {
  const state = getState();
  if (!state.equipped.includes(itemId)) return;

  unequip(itemId);
  emit('itemUnequipped', { itemId });
}

export function useItem(itemId) {
  const state = getState();
  const item = ITEMS[itemId];
  const effect = item?.onUseEffect ? EFFECTS[item.onUseEffect] : null;
  if (!effect) return; // not usable
  if (!state.inventory[itemId]) return; // must own at least one

  addItem(itemId, -1);
  emit('itemUsed', { itemId, effectId: item.onUseEffect, message: effect.message });
}

export function canCraft(recipeId, state = getState()) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;
  if (state.slots[SELF_SLOT_INDEX]?.status !== 'idle') return false; // hands are busy
  return Object.entries(recipe.inputs).every(([itemId, qty]) => (state.inventory[itemId] ?? 0) >= qty);
}

export function craftItem(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe || !canCraft(recipeId)) return;

  for (const [itemId, qty] of Object.entries(recipe.inputs)) addItem(itemId, -qty);
  setSlotCraftRecipe(SELF_SLOT_INDEX, recipeId);
  setSlotStatus(SELF_SLOT_INDEX, 'crafting');
  emit('craftStarted', { recipeId });
}

export function tick() {
  const now = Date.now();
  getState().slots.forEach((slot, i) => {
    if (slot.status === 'active' && now - slot.startedAt >= GATHER.activeMs) {
      resolveSlot(i);
    } else if (slot.status === 'recovery' && now - slot.startedAt >= GATHER.recoveryMs) {
      setSlotStatus(i, 'idle', null);
    } else if (slot.status === 'crafting') {
      const recipeId = slot.craftRecipeId;
      const recipe = RECIPES[recipeId];
      if (recipe && now - slot.startedAt >= (recipe.craftMs ?? 0)) {
        addItem(recipeId, 1);
        setSlotCraftRecipe(i, null);
        setSlotStatus(i, 'idle', null);
        emit('itemCrafted', { recipeId });
      }
    } else if (slot.status === 'sailing') {
      // slot.zoneId is still the origin until arrival, so this is the
      // same route sailSlot priced — safe to recompute rather than
      // stash on the slot.
      const route = findRoute(slot.zoneId, slot.targetZoneId);
      if (route && now - slot.startedAt >= route.timeMs) {
        setSlotZone(i, slot.targetZoneId);
        setSlotStatus(i, 'idle', null);
        emit('slotArrived', { index: i, zoneId: slot.targetZoneId });
      }
    }
  });
  touch();
}

function resolveSlot(index) {
  const slot = getState().slots[index];

  const zone = ZONES[slot.zoneId];
  const itemId = zone ? resolveDrop(zone.dropTable) : null;
  if (itemId) {
    addItem(itemId, 1);
    emit('itemDropped', { index, itemId });
  }

  setSlotStatus(index, 'recovery');
  emit('slotResolved', { index });
}

// D2-style TreasureClass resolution: roll the weighted table, then if
// the picked id names another treasure class, recurse into it instead
// of returning it. 'nothing' (or any id matching neither a TC nor an
// item) bottoms out as no drop — this is also how "no drop" happens at
// all, there's no separate drop-chance roll gating this.
function resolveDrop(entries, depth = 0) {
  if (depth > MAX_DROP_DEPTH) return null;
  const picked = pickWeighted(entries);
  if (!picked) return null;
  const nested = TREASURE_CLASSES[picked];
  if (nested) return resolveDrop(nested.entries, depth + 1);
  return ITEMS[picked] ? picked : null;
}

function pickWeighted(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]?.id;
}
