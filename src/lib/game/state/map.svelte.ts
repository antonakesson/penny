import { DISTANCE_STEP } from '../config';
import { hashSeed, elevationNoise } from '../util/noise';

let seed = $state<string>(crypto.randomUUID());
let numericSeed = hashSeed(seed);
// Separately-hashed seed, not the same numericSeed reused at a different
// offset - two lattices sharing one seed would still correlate at nearby x
// (any shared gradient point ties both curves to the same value there).
// A second hash gives an independent lattice so difficulty and terrain can
// disagree at the same distance.
let difficultyNumericSeed = hashSeed(seed + ':difficulty');
let distance = $state(0);

export function getDistance(): number {
  return distance;
}

export function getSeed(): string {
  return seed;
}

export function advance(amount = 1) {
  distance += amount;
}

// 0..1 — an agnostic seed-derived signal at an arbitrary distance. Noise is
// a pure function of (distance, seed), so past/future points are recomputed
// on demand rather than stored — a debug trace can sample a window of them
// without map.ts needing to keep any history buffer of its own. map.ts has
// no opinion on what this value means — that's entirely up to the caller
// (see zones.ts).
export function getSignalAt(atDistance: number): number {
  return (elevationNoise(atDistance * DISTANCE_STEP, numericSeed) + 1) / 2;
}

// 0..1 — the signal at the player's current distance. Callers are free to
// ignore it entirely (see zones.ts); the map doesn't know or care whether
// anything honors it.
export function getSignal(): number {
  return getSignalAt(distance);
}

// 0..1 — a second, independent seed-derived signal at an arbitrary distance.
// Same shape and contract as getSignalAt (agnostic, caller interprets), but
// deliberately decorrelated from it so a caller can use one for "what" and
// the other for "how much" without the two riding the same curve. zones.ts
// uses this one for encounter difficulty.
export function getDifficultyAt(atDistance: number): number {
  return (elevationNoise(atDistance * DISTANCE_STEP, difficultyNumericSeed) + 1) / 2;
}

// 0..1 — the difficulty signal at the player's current distance.
export function getDifficulty(): number {
  return getDifficultyAt(distance);
}

export interface MapSnapshot {
  seed: string;
  distance: number;
}

export function serializeMap(): MapSnapshot {
  return { seed, distance };
}

export function hydrateMap(snapshot: MapSnapshot) {
  seed = snapshot.seed;
  numericSeed = hashSeed(seed);
  difficultyNumericSeed = hashSeed(seed + ':difficulty');
  distance = snapshot.distance;
}
