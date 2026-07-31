// Dev-only debug tools - both a window.__dev console API and the backing
// functions DevTools.svelte uses. Gated by import.meta.env.DEV, a
// compile-time constant Vite replaces with `false` in production builds,
// so dead-code elimination strips this whole module's effects (including
// the window assignment) out of the shipped bundle entirely.
import { createEncounter, spawn, getEncounter } from './state/encounter.svelte';
import { getAction } from './state/action.svelte';
import { addItem, getInventory } from './state/inventory.svelte';
import { addXp, getXp } from './state/xp.svelte';
import { getSeed, getDistance, hydrateMap } from './state/map.svelte';
import { triggerEffect } from './state/effect.svelte';
import { serializeModifiers } from './state/modifier.svelte';
import type { EncounterId } from './data/encounters';
import type { ItemId } from './data/loot';
import type { EffectId } from './data/effects';

export function devSpawn(id: EncounterId) {
  spawn(createEncounter(id));
}

export function devAddItem(id: ItemId, qty: number) {
  addItem(id, qty);
}

// Silent grant, no floating text - dev-only, bypasses the real reward
// path (engine.ts's awardXp()) on purpose.
export function devAwardXp(amount: number) {
  addXp(amount);
}

export function devSetDistance(distance: number) {
  hydrateMap({ seed: getSeed(), distance });
}

export function devSetSeed(seed: string) {
  hydrateMap({ seed, distance: getDistance() });
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
    // Passives aren't included - they're not their own state, just a live
    // scan of inventory x ITEMS[id].passive, already visible above.
    permanentModifiers: serializeModifiers(),
  };
}

if (import.meta.env.DEV) {
  (window as unknown as { __dev: unknown }).__dev = {
    spawn: devSpawn,
    addItem: devAddItem,
    awardXp: devAwardXp,
    setDistance: devSetDistance,
    setSeed: devSetSeed,
    triggerEffect: devTriggerEffect,
    state: devDumpState,
  };
}
