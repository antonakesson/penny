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
// Per-zone high-water mark - furthest distance ever reached, independent of
// where the player currently stands. Only ever grows, via bumpFrontier()
// below; walking backward moves `distances` without touching this. Not
// consumed by anything yet (Auto Travel's target-picker and a route-map's
// "how far back can I look" are the known future readers) - added now,
// alongside `returning`, because both live in the same MapSnapshot and
// there's no reason to grow that shape twice.
let frontier = $state<Partial<Record<ZoneId, number>>>({});
// Which way advance() steps once an encounter resolves. Persisted like the
// rest of this file's state (see MapSnapshot below) rather than kept
// memory-only - distances/frontier already survive a reload, and a lone
// in-memory exception here would just be an inconsistency, not a real save
// saving.
let returning = $state(false);

export function getDistance(): number {
  return distances[getCurrentZoneId()] ?? 0;
}

// Defaults to the current zone - callers checking another zone's frontier
// (a future travel-target picker) pass one explicitly.
export function getFrontier(zoneId: ZoneId = getCurrentZoneId()): number {
  return frontier[zoneId] ?? 0;
}

export function isReturning(): boolean {
  return returning;
}

export function setReturning(value: boolean) {
  returning = value;
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

function bumpFrontier(zoneId: ZoneId, value: number) {
  if (value > (frontier[zoneId] ?? 0)) frontier[zoneId] = value;
}

// `returning` flips the sign here rather than at each call site - all three
// callers (combatEngine.ts's resolveKill, crossroadEngine.ts's
// resolveCrossroadChoice, dialogEngine.ts's dismissDialog) just mean "take
// the post-resolution step," and which way that step goes is this module's
// business, not theirs. Unclamped - distance is linear and 0 is just where a
// crossroad landing happens to start you, not a floor. Turning around at 0
// and continuing to retreat walks out the negative side, same as advancing
// walks out the positive side.
export function advance(amount = 1) {
  const zoneId = getCurrentZoneId();
  const next = (distances[zoneId] ?? 0) + (returning ? -amount : amount);
  distances[zoneId] = next;
  bumpFrontier(zoneId, next);
}

// Real-play jump to a specific distance within the current zone -
// crossroadEngine.ts's resolveCrossroadChoice() (landing at a branch's
// entryDistance) and devtools.ts's devSetDistance() are the only callers.
// Distinct from hydrateMap() below (a save-load restore), same split as
// switchZone() vs hydrateZone() in state/zone.svelte.ts.
export function setDistance(value: number) {
  const zoneId = getCurrentZoneId();
  distances[zoneId] = value;
  bumpFrontier(zoneId, value);
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
  frontier: Partial<Record<ZoneId, number>>;
  returning: boolean;
}

// Read-only whole-map accessor - save.ts's buildSnapshot() and devtools.ts's
// devSetSeed() (which needs to carry every zone's distance forward across a
// seed change, not just the current one) are the only callers.
export function getAllDistances(): Readonly<Partial<Record<ZoneId, number>>> {
  return distances;
}

// Same shape/reason as getAllDistances() - devSetSeed() needs to carry every
// zone's frontier forward too, not just the current zone's.
export function getAllFrontiers(): Readonly<Partial<Record<ZoneId, number>>> {
  return frontier;
}

export function serializeMap(): MapSnapshot {
  return { seed, distances: { ...distances }, frontier: { ...frontier }, returning };
}

export function hydrateMap(snapshot: MapSnapshot) {
  seed = snapshot.seed;
  distances = { ...snapshot.distances };
  frontier = { ...snapshot.frontier };
  returning = snapshot.returning;
}
