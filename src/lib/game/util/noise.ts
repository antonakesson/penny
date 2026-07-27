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
export function elevationNoise(x: number, seed: number): number {
  const i0 = Math.floor(x);
  const i1 = i0 + 1;
  const n0 = latticeGradient(i0, seed) * (x - i0);
  const n1 = latticeGradient(i1, seed) * (x - i1);
  const raw = lerp(n0, n1, fade(x - i0));
  return Math.max(-1, Math.min(1, raw * AMPLITUDE_SCALE));
}
