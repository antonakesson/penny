// Dev-only debug tools - both a window.__dev console API and the backing
// functions DevTools.svelte uses. Gated by import.meta.env.DEV, a
// compile-time constant Vite replaces with `false` in production builds,
// so dead-code elimination strips this whole module's effects (including
// the window assignment) out of the shipped bundle entirely.
import { createMonster, spawn, getEncounter } from './state/encounter.svelte';
import { getAction } from './state/action.svelte';
import { addItem, getInventory } from './state/inventory.svelte';
import { awardXp, getXp } from './state/xp.svelte';
import { getSeed, getDistance, hydrateMap } from './state/map.svelte';
import { startSpawnFreeze } from './state/spawnFreeze.svelte';
import type { MonsterId } from './data/monstats';
import type { ItemId } from './data/loot';

export function devSpawn(id: MonsterId) {
  spawn(createMonster(id));
}

export function devAddItem(id: ItemId, qty: number) {
  addItem(id, qty);
}

export function devAwardXp(amount: number) {
  awardXp(amount);
}

export function devSetDistance(distance: number) {
  hydrateMap({ seed: getSeed(), distance });
}

export function devStartSpawnFreeze(kills: number) {
  startSpawnFreeze(kills);
}

export function devDumpState() {
  return {
    encounter: getEncounter(),
    action: getAction(),
    inventory: getInventory(),
    xp: getXp(),
    distance: getDistance(),
  };
}

if (import.meta.env.DEV) {
  (window as unknown as { __dev: unknown }).__dev = {
    spawn: devSpawn,
    addItem: devAddItem,
    awardXp: devAwardXp,
    setDistance: devSetDistance,
    setSpawnFreeze: devStartSpawnFreeze,
    state: devDumpState,
  };
}
