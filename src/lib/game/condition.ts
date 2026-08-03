import type { Condition } from './data/condition';
import { getInventory } from './state/inventory.svelte';
import { isFeatureUnlocked } from './state/features.svelte';
import { hasFlag } from './state/journalFlags.svelte';
import { assertNever } from './util/assertNever';

// Pure cross-domain read - no writes, so this doesn't need to live in
// engine.ts (see architecture_state_ownership: reads across modules are
// fine, it's composed *writes* that have to funnel through engine.ts).
// Pulled out to its own module so every Condition consumer (dialog choices,
// journal entries, and whatever gets a `when?: Condition` next) shares one
// evaluator instead of growing its own copy.
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
