import { ITEMS } from './items.js';

// Derived, not stored — recomputed from state.equipped so there's
// nothing to keep in sync when gear is equipped/unequipped.
export function getEquippedStats(state) {
  const totals = {};
  for (const itemId of state.equipped) {
    const stats = ITEMS[itemId]?.stats;
    if (!stats) continue;
    for (const [key, value] of Object.entries(stats)) {
      totals[key] = (totals[key] ?? 0) + value;
    }
  }
  return totals;
}
