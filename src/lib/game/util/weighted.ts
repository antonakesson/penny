// Shared by any weighted-random selection (encounter pools, loot tables).
// Callers supply [item, weight] pairs — not an object shape — since callers'
// weight sources differ (object property vs. Record value).
export function weightedPick<T>(entries: readonly (readonly [T, number])[]): T {
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * totalWeight;
  for (const [item, weight] of entries) {
    if (roll < weight) return item;
    roll -= weight;
  }
  return entries[entries.length - 1][0];
}
