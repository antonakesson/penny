import type { ItemId } from './loot';
import type { FeatureId } from './features';
import type { FlagId } from './journalFlags';

// Grown one kind at a time as a real need lands - not a general predicate
// engine. `flag`'s `equals` covers negation directly; no separate `not`
// wrapper until hasItem/hasFeature actually need negating too.
export type Condition =
  | { kind: 'hasItem'; itemId: ItemId; qty?: number } // qty defaults to 1
  | { kind: 'hasFeature'; feature: FeatureId }
  | { kind: 'flag'; flag: FlagId; equals?: boolean } // equals defaults to true
  // Which way the player is currently walking (map.svelte.ts's `returning`).
  // Carries an `equals` where hasItem/hasFeature deliberately don't: facing
  // out is as real and as authorable a state as facing back, so both sides
  // are worth naming - unlike "does NOT have the book", which has no
  // encounter asking for it yet.
  //
  // Distance is the only geometry a 1D world has, so direction is the only
  // way an encounter can differ by where you're standing rather than by what
  // you're carrying. Any POI can now have a seen-from-behind variant (see
  // ENCOUNTER_SUBSTITUTIONS in encounters.ts) - a sign facing the way you
  // came, something only legible on the walk out.
  | { kind: 'returning'; equals?: boolean }; // equals defaults to true
