import { DISTANCE_STEP } from '../config';
import { hashSeed, elevationNoise } from '../util/noise';
import { getCurrentZoneId } from './zone.svelte';
import type { ZoneId } from '../data/zoneIds';

let seed = $state<string>(crypto.randomUUID());
// Keyed by zone - a crossroad branch (crossroadEngine.ts's
// resolveCrossroadChoice()) lands at an author-specified distance in the
// destination zone, independent of wherever the player was in the zone they
// left. Missing entries default to 0 (a zone nobody's ever stood in yet).
let distances = $state<Partial<Record<ZoneId, number>>>({});

export function getDistance(): number {
  return distances[getCurrentZoneId()] ?? 0;
}

export function getSeed(): string {
  return seed;
}

// Independent lattice per zone, not just per terrain-vs-difficulty (see
// difficultySeedFor below) - a shared lattice would correlate at nearby x,
// and since a crossroad landing resets distance to some small
// author-chosen number (see state above), every zone's opening stretch
// would otherwise trace the same noise shape under the same seed. Cheap to
// hash fresh per call (hashSeed is a few dozen char-ops) - no need to store
// or memoize per zone the way the single old numericSeed was.
function terrainSeedFor(zoneId: ZoneId): number {
  return hashSeed(`${seed}:${zoneId}`);
}

function difficultySeedFor(zoneId: ZoneId): number {
  return hashSeed(`${seed}:difficulty:${zoneId}`);
}

// The current zone's terrain lattice seed, reused as the placement seed for
// map.ts's idHash-based POI anchoring - same reasoning as before this was
// made per-zone (idHash's string-keyed domain doesn't collide with
// elevationNoise's integer-lattice one even sharing the same base number),
// just now scoped to whichever zone resolvePoiAt() is actually being asked
// about, which is always the current one (see engine.ts's decideNextEncounter).
export function getNumericSeed(): number {
  return terrainSeedFor(getCurrentZoneId());
}

export function advance(amount = 1) {
  const zoneId = getCurrentZoneId();
  distances[zoneId] = (distances[zoneId] ?? 0) + amount;
}

// Real-play jump to a specific distance within the current zone -
// crossroadEngine.ts's resolveCrossroadChoice() (landing at a branch's
// entryDistance) and devtools.ts's devSetDistance() are the only callers.
// Distinct from hydrateMap() below (a save-load restore), same split as
// switchZone() vs hydrateZone() in state/zone.svelte.ts.
export function setDistance(value: number) {
  distances[getCurrentZoneId()] = value;
}

// 0..1 - a pure function of (distance, seed, current zone), recomputed on
// demand rather than stored.
export function getSignalAt(atDistance: number): number {
  return (elevationNoise(atDistance * DISTANCE_STEP, terrainSeedFor(getCurrentZoneId())) + 1) / 2;
}

export function getSignal(): number {
  return getSignalAt(getDistance());
}

// 0..1 - independent from getSignalAt, so a caller can use one for "what"
// and the other for "how much" without both riding the same curve.
export function getDifficultyAt(atDistance: number): number {
  return (elevationNoise(atDistance * DISTANCE_STEP, difficultySeedFor(getCurrentZoneId())) + 1) / 2;
}

// 0..1 — the difficulty signal at the player's current distance.
export function getDifficulty(): number {
  return getDifficultyAt(getDistance());
}

export interface MapSnapshot {
  seed: string;
  distances: Partial<Record<ZoneId, number>>;
}

// Read-only whole-map accessor - save.ts's buildSnapshot() and devtools.ts's
// devSetSeed() (which needs to carry every zone's distance forward across a
// seed change, not just the current one) are the only callers.
export function getAllDistances(): Readonly<Partial<Record<ZoneId, number>>> {
  return distances;
}

export function serializeMap(): MapSnapshot {
  return { seed, distances: { ...distances } };
}

export function hydrateMap(snapshot: MapSnapshot) {
  seed = snapshot.seed;
  distances = { ...snapshot.distances };
}
