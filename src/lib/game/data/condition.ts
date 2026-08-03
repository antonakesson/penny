import type { ItemId } from './loot';
import type { FeatureId } from './features';
import type { FlagId } from './journalFlags';

// Grown one kind at a time as a real need lands - not a general predicate
// engine. `flag`'s `equals` covers negation directly; no separate `not`
// wrapper until hasItem/hasFeature actually need negating too.
export type Condition =
  | { kind: 'hasItem'; itemId: ItemId; qty?: number } // qty defaults to 1
  | { kind: 'hasFeature'; feature: FeatureId }
  | { kind: 'flag'; flag: FlagId; equals?: boolean }; // equals defaults to true
