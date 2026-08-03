// `roll` is a 0..1 position into the cumulative weight table - defaults to
// Math.random(), but callers can supply a biased roll instead.
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
