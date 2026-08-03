import { DISTANCE_STEP } from '../config';
import { hashSeed, elevationNoise } from '../util/noise';

let seed = $state<string>(crypto.randomUUID());
let numericSeed = hashSeed(seed);
// Separately-hashed seed - a shared lattice would correlate at nearby x, so
// difficulty and terrain need independent lattices to disagree.
let difficultyNumericSeed = hashSeed(seed + ':difficulty');
let distance = $state(0);

export function getDistance(): number {
  return distance;
}

export function getSeed(): string {
  return seed;
}

// The terrain lattice's numeric seed, reused as the placement seed for
// map.ts's idHash-based POI anchoring - no need for a third independent
// seed, idHash's string-keyed domain doesn't collide with elevationNoise's
// integer-lattice one even sharing the same base number.
export function getNumericSeed(): number {
  return numericSeed;
}

export function advance(amount = 1) {
  distance += amount;
}

// 0..1 - a pure function of (distance, seed), recomputed on demand rather
// than stored.
export function getSignalAt(atDistance: number): number {
  return (elevationNoise(atDistance * DISTANCE_STEP, numericSeed) + 1) / 2;
}

export function getSignal(): number {
  return getSignalAt(distance);
}

// 0..1 - independent from getSignalAt, so a caller can use one for "what"
// and the other for "how much" without both riding the same curve.
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
