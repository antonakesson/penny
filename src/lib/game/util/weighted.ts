// Shared by any weighted-random selection (encounter pools, loot tables).
// Callers supply [item, weight] pairs — not an object shape — since callers'
// weight sources differ (object property vs. Record value).
// `roll` is a 0..1 position into the cumulative weight table — defaults to
// Math.random() but callers can supply their own (e.g. zones.ts feeds it an
// elevation-biased roll instead of a uniform one).
export function weightedPick<T>(entries: readonly (readonly [T, number])[], roll: number = Math.random()): T {
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let r = roll * totalWeight;
  for (const [item, weight] of entries) {
    if (r < weight) return item;
    r -= weight;
  }
  return entries[entries.length - 1][0];
}
