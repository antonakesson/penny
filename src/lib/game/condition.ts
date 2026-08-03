import type { Condition } from './data/condition';
import { getInventory } from './state/inventory.svelte';
import { isFeatureUnlocked } from './state/features.svelte';
import { hasFlag } from './state/journalFlags.svelte';
import { assertNever } from './util/assertNever';

// Pure read, no writes - shared by every Condition consumer (dialog
// choices, journal entries) instead of each growing its own copy.
export function evaluateCondition(condition: Condition): boolean {
  switch (condition.kind) {
    case 'hasItem':
      return (getInventory()[condition.itemId] ?? 0) >= (condition.qty ?? 1);
    case 'hasFeature':
      return isFeatureUnlocked(condition.feature);
    case 'flag':
      return hasFlag(condition.flag) === (condition.equals ?? true);
    default:
      return assertNever(condition);
  }
}
