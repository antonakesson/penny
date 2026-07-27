import { DISTANCE_STEP } from '../config';

// Deterministic string -> uint32 hash (djb2), turns the seed string into a
// numeric seed baked into the lattice hash below.
function hashSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return hash >>> 0;
}

// Deterministic pseudo-random gradient in [-1, 1] for an integer lattice
// point, mixed with the numeric seed — an integer hash (murmur3-style
// finalizer), no permutation table or external noise lib needed.
function latticeGradient(i: number, seed: number): number {
  let h = (Math.imul(i, 0x27220a95) ^ seed) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = h ^ (h >>> 16);
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

// 1D gradient noise's natural amplitude tops out around ±0.5, not ±1 —
// measured empirically across several seeds. Without this, normalized
// elevation clusters near 0.5 and rarely approaches 0 or 1. Scaled up and
// clamped so the full 0..1 range is actually reachable.
const AMPLITUDE_SCALE = 2;

// Hand-rolled 1D gradient (Perlin-style) noise: smooth and continuous
// between integer lattice points, deterministic from (x, seed).
function elevationNoise(x: number, seed: number): number {
  const i0 = Math.floor(x);
  const i1 = i0 + 1;
  const n0 = latticeGradient(i0, seed) * (x - i0);
  const n1 = latticeGradient(i1, seed) * (x - i1);
  const raw = lerp(n0, n1, fade(x - i0));
  return Math.max(-1, Math.min(1, raw * AMPLITUDE_SCALE));
}

let seed = $state<string>(crypto.randomUUID());
let numericSeed = hashSeed(seed);
let distance = $state(0);

export function getDistance(): number {
  return distance;
}

export function advance(amount = 1) {
  distance += amount;
}

// 0..1 — elevation at an arbitrary distance. Noise is a pure function of
// (distance, seed), so past/future points are recomputed on demand rather
// than stored — a debug trace can sample a window of them without map.ts
// needing to keep any history buffer of its own.
export function getElevationAt(atDistance: number): number {
  return (elevationNoise(atDistance * DISTANCE_STEP, numericSeed) + 1) / 2;
}

// 0..1 — the zone's "recommended" spot on its weight table at the player's
// current distance. Callers are free to ignore it entirely (see zones.ts);
// the map doesn't know or care whether anything honors it.
export function getElevation(): number {
  return getElevationAt(distance);
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
  distance = snapshot.distance;
}
