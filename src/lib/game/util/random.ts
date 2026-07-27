// Shared by any caller that needs to jitter a value with true randomness
// (encounter roll, future loot/luck rolls) rather than reading it straight.

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// Box-Muller transform — one N(0, stddev) sample per call. Deliberately
// plain Math.random(), not seeded: the deterministic part of a roll should
// come from whatever mean is passed in (e.g. map.svelte.ts's elevation
// curve), not from this jitter.
export function gaussianJitter(stddev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * stddev;
}
