// Dev-only debug tools - window.__dev console API + DevTools.svelte's
// backing functions. Gated by import.meta.env.DEV, stripped from prod.
import { createEncounter, spawn, getEncounter } from './state/encounter.svelte';
import { getAction } from './state/action.svelte';
import { addItem, getInventory } from './state/inventory.svelte';
import { addXp, getXp } from './state/xp.svelte';
import { getSeed, getDistance, getAllDistances, setDistance, hydrateMap } from './state/map.svelte';
import { getCurrentZoneId, switchZone } from './state/zone.svelte';
import { triggerEffect } from './state/effect.svelte';
import { serializeModifiers } from './state/modifier.svelte';
import { getAllFlags } from './state/journalFlags.svelte';
import type { EncounterId } from './data/encounters';
import type { ItemId } from './data/loot';
import type { EffectId } from './data/effects';
import type { ZoneId } from './data/zones';

export function devSpawn(id: EncounterId) {
  spawn(createEncounter(id));
}

export function devAddItem(id: ItemId, qty: number) {
  addItem(id, qty);
}

// Bypasses engine.ts's awardXp() - silent grant, no floating text.
export function devAwardXp(amount: number) {
  addXp(amount);
}

export function devSetDistance(distance: number) {
  setDistance(distance);
}

export function devSetSeed(seed: string) {
  hydrateMap({ seed, distances: { ...getAllDistances() } });
}

// Jumps straight to a zone for testing without walking a crossroad -
// distance is untouched, same coordinate space, different content pool.
export function devSetZone(id: ZoneId) {
  switchZone(id);
}

export function devTriggerEffect(effectId: EffectId) {
  triggerEffect(effectId);
}

export function devDumpState() {
  return {
    encounter: getEncounter(),
    action: getAction(),
    inventory: getInventory(),
    xp: getXp(),
    distance: getDistance(),
    zone: getCurrentZoneId(),
    permanentModifiers: serializeModifiers(),
    flags: getAllFlags(),
  };
}

if (import.meta.env.DEV) {
  (window as unknown as { __dev: unknown }).__dev = {
    spawn: devSpawn,
    addItem: devAddItem,
    awardXp: devAwardXp,
    setDistance: devSetDistance,
    setSeed: devSetSeed,
    setZone: devSetZone,
    triggerEffect: devTriggerEffect,
    state: devDumpState,
  };
}
