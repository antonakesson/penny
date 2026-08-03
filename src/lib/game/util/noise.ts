// Pure noise math, no Svelte runes — kept separate from state/map.svelte.ts
// so it's importable from plain scripts/experiments too.

// Deterministic string -> uint32 hash (djb2), turns a seed string into a
// numeric seed baked into the lattice hash below.
export function hashSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return hash >>> 0;
}

// Deterministic pseudo-random gradient in [-1, 1] for an integer lattice
// point, mixed with the numeric seed.
function latticeGradient(i: number, seed: number): number {
  let h = (Math.imul(i, 0x27220a95) ^ seed) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = h ^ (h >>> 16);
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

// Stateless per-identity placement hash - same finalizer as latticeGradient
// above, keyed by a string id instead of a lattice index. Independent of
// every other id and of declaration order, so adding new content never
// reshuffles existing placements under the same seed - the failure mode a
// stateful/sequential RNG stream would have (see FEATURE_ZONE_MAP_REWORK.md).
export function idHash(id: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x27220a95);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 0xffffffff; // 0..1
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

// Raw amplitude tops out around ±0.5, not ±1 - scaled up and clamped so
// the full 0..1 range is reachable.
const AMPLITUDE_SCALE = 2;

// Hand-rolled 1D gradient (Perlin-style) noise: smooth and continuous
// between integer lattice points, deterministic from (x, seed).
export function elevationNoise(x: number, seed: number): number {
  const i0 = Math.floor(x);
  const i1 = i0 + 1;
  const n0 = latticeGradient(i0, seed) * (x - i0);
  const n1 = latticeGradient(i1, seed) * (x - i1);
  const raw = lerp(n0, n1, fade(x - i0));
  return Math.max(-1, Math.min(1, raw * AMPLITUDE_SCALE));
}
