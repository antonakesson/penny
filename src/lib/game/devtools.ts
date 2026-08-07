// Dev-only debug tools - window.__dev console API + DevTools.svelte's
// backing functions. Gated by import.meta.env.DEV, stripped from prod.
import { createEncounter, spawn, getEncounter } from './state/encounter.svelte';
import { getActivations, getHeldFaculties } from './state/skillActivation.svelte';
import { addItem, getInventory } from './state/inventory.svelte';
import { addXp, getXp } from './state/xp.svelte';
import {
  getSeed,
  getDistance,
  getSignalAt,
  getAllDistances,
  getAllFrontiers,
  isReturning,
  setDistance,
  setReturning,
  hydrateMap,
} from './state/map.svelte';
import { resolveSubZone } from './map';
import { habitatFitReport, pickByHabitat } from './util/habitat';
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

// Balancing readout for the signal-driven spawn table (util/habitat.ts).
// `declared` is what the table asks for, `expected` what the habitat fit
// actually converges to, `actual` what a simulated walk of `steps` from the
// current distance really produced - so a habitat parked somewhere the signal
// never goes shows up as a shortfall here instead of silently starving, which
// is exactly how the old signal-as-roll version failed unnoticed.
export function devSampleSpawns(steps = 20_000) {
  const { subZone } = resolveSubZone(getCurrentZoneId(), getDistance());
  const rows = habitatFitReport(subZone.encounters);
  const counts = new Map<EncounterId, number>();
  const start = getDistance();
  for (let i = 0; i < steps; i++) {
    const id = pickByHabitat(subZone.encounters, getSignalAt(start + i));
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  return rows.map((row) => ({
    id: row.id,
    declared: pct(row.declared),
    expected: pct(row.expected),
    actual: pct((counts.get(row.id) ?? 0) / steps),
  }));
}

export function devDumpState() {
  return {
    encounter: getEncounter(),
    activations: getActivations(),
    heldFaculties: [...getHeldFaculties()],
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
    sampleSpawns: devSampleSpawns,
    state: devDumpState,
  };
}
