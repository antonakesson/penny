// Dev-only debug tools - window.__dev console API + DevTools.svelte's
// backing functions. Gated by import.meta.env.DEV, stripped from prod.
import { createEncounter, spawn, getEncounter } from './state/encounter.svelte';
import { getExclusiveSkill } from './state/skillActivation.svelte';
import { addItem, getInventory } from './state/inventory.svelte';
import { addXp, getXp } from './state/xp.svelte';
import {
  getSeed,
  getDistance,
  getAllDistances,
  getAllFrontiers,
  isReturning,
  setDistance,
  setReturning,
  hydrateMap,
} from './state/map.svelte';
import { getCurrentZoneId, switchZone } from './state/zone.svelte';
import { triggerEffect } from './state/effect.svelte';
import { serializeModifiers } from './state/modifier.svelte';
import { getAllFlags } from './state/journalFlags.svelte';
import { learnSkill, getKnownSkillIds } from './state/skill.svelte';
import type { EncounterId } from './data/encounters';
import type { ItemId } from './data/loot';
import type { EffectId } from './data/effects';
import type { ZoneId } from './data/zones';
import type { SkillId } from './data/skills';

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

export function devSetReturning(value: boolean) {
  setReturning(value);
}

export function devSetSeed(seed: string) {
  hydrateMap({ seed, distances: { ...getAllDistances() }, frontier: { ...getAllFrontiers() }, returning: isReturning() });
}

// Jumps straight to a zone for testing without walking a crossroad -
// distance is untouched, same coordinate space, different content pool.
export function devSetZone(id: ZoneId) {
  switchZone(id);
}

export function devTriggerEffect(effectId: EffectId) {
  triggerEffect(effectId);
}

export function devLearnSkill(skillId: SkillId) {
  learnSkill(skillId);
}

export function devDumpState() {
  return {
    encounter: getEncounter(),
    activeSkill: getExclusiveSkill(),
    inventory: getInventory(),
    xp: getXp(),
    distance: getDistance(),
    zone: getCurrentZoneId(),
    returning: isReturning(),
    permanentModifiers: serializeModifiers(),
    flags: getAllFlags(),
    knownSkills: getKnownSkillIds(),
  };
}

if (import.meta.env.DEV) {
  (window as unknown as { __dev: unknown }).__dev = {
    spawn: devSpawn,
    addItem: devAddItem,
    awardXp: devAwardXp,
    setDistance: devSetDistance,
    setReturning: devSetReturning,
    setSeed: devSetSeed,
    setZone: devSetZone,
    triggerEffect: devTriggerEffect,
    learnSkill: devLearnSkill,
    state: devDumpState,
  };
}
