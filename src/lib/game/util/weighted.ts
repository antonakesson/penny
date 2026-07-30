// Shared by any weighted-random selection (encounter pools, loot tables).
// Callers supply [item, weight] pairs — not an object shape — since callers'
// weight sources differ (object property vs. Record value).
// `roll` is a 0..1 position into the cumulative weight table — defaults to
// Math.random() but callers can supply their own (e.g. zones.ts feeds it a
// signal-biased roll instead of a uniform one).
export function weightedPick<T>(entries: readonly (readonly [T, number])[], roll: number = Math.random()): T {
  if (entries.length === 0) throw new Error('weightedPick: entries is empty');
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let r = roll * totalWeight;
  for (const [item, weight] of entries) {
    if (r < weight) return item;
    r -= weight;
  }
  return entries[entries.length - 1][0];
}

// Chance ramps 0% at min to 100% at max, clamped outside that range —
// below min always false, at/above max always true (Math.random() never
// returns exactly 1, so the inequality can't fail there). Reusable for
// any "guaranteed by X, but can happen earlier" one-shot trigger.
export function rollDistanceChance(min: number, max: number, distance: number): boolean {
  return Math.random() * (max - min) < distance - min;
}
