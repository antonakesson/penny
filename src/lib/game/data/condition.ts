import type { ItemId } from './loot';
import type { FeatureId } from './features';
import type { FlagId } from './journalFlags';

// Grown one kind at a time as a real need for it lands - not a general
// predicate engine. Shared between dialog choices (DialogChoice.when) and
// journal entry variants (JournalVariant.when) so both read off one
// evaluator (evaluateCondition in engine.ts) instead of each growing their
// own copy. `flag`'s `equals` covers negation directly (a choice's
// visibility isn't "first match wins" like a journal entry's variant list,
// so two choices that should be mutually exclusive need an actual
// negation, not just ordering) - no separate recursive `not` wrapper kind,
// since a flag is the only condition that's ever needed one; add a real
// combinator only once hasItem/hasFeature actually need negating too.
export type Condition =
  | { kind: 'hasItem'; itemId: ItemId; qty?: number } // qty defaults to 1
  | { kind: 'hasFeature'; feature: FeatureId }
  | { kind: 'flag'; flag: FlagId; equals?: boolean }; // equals defaults to true
