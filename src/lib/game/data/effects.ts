import type { FeatureId } from './features';
import type { Modifier } from './modifiers';
import type { EncounterId } from './encounters';
import type { ItemId } from './loot';
import type { FlagId } from './journalFlags';

interface EffectBase {
  title: string;
  description: string;
  // Plain read off journalFlags, checked directly in triggerEffect() - not
  // routed through engine.ts's Condition/evaluateCondition (that's for
  // composed multi-kind gates; this is just "has this already happened,
  // ever" for a single flag). Once true, the effect no-ops entirely -
  // "only ever fires once" for things like a genie that shouldn't grant a
  // second wish, not a per-use toggle.
  guardFlag?: FlagId;
}

export type EffectDef = EffectBase &
  (
    | { kind: 'unlockFeature'; feature: FeatureId }
    | { kind: 'freezeSpawn'; duration: number } // ms, wall-clock
    // No duration, same bucket as unlockFeature - runs once, done forever.
    // The permanent counterpart to a held item's `passive` modifiers (see
    // ItemDef.passive in loot.ts): this is for a bonus that outlives the
    // item, e.g. a consumed book. state/modifier.svelte.ts owns the
    // persisted total this adds to.
    | { kind: 'grantModifier'; modifier: Modifier }
    // Cuts in front of whatever's currently active - see
    // interruptEncounter() in state/encounter.svelte.ts. Immediate, not
    // queued: obvious feedback on item use matters more than politely
    // waiting a turn. Doesn't destroy progress either - a fight mid-grind
    // (an hour-long boss) is paused, not killed, and resumes exactly where
    // it was once this resolves. level is always the def's own authored
    // level - an effect-launched encounter (a genie, a story beat) isn't
    // zone-distance scaled the way a normal spawn is.
    | { kind: 'launchEncounter'; encounterId: EncounterId }
    // Straight inventory grant, no roll - for a specific, named reward
    // outside the kill-loot path (resolveDropIds/TREASURE in loot.ts).
    // Doesn't respect ITEM_CAP - if you want a curated *random* reward that
    // does, route it through a TREASURE pool + awardLoot() instead.
    | { kind: 'grantItem'; itemId: ItemId }
    | { kind: 'grantXp'; amount: number }
    // Removes one `from`, grants one `to` - for turning a held item into its
    // spent/inert counterpart (see corkedBottle -> emptyCorkedBottle in
    // loot.ts) at the moment the thing it enables actually resolves, rather
    // than consuming on use like ItemDef.action's `consumes` does.
    | { kind: 'swapItem'; from: ItemId; to: ItemId }
  );

// Hand-written, not `keyof typeof EFFECTS`: EffectDef.grantItem needs ItemId
// and ItemDef.action needs EffectId back, so deriving both from each other
// is a TS mutual-recursion error.
export type EffectId =
  | 'unlockJournal'
  | 'unlockPet'
  | 'freezeSpawn'
  | 'permanentDamageBoost'
  | 'eatChicken'
  | 'summonGenie'
  | 'grantGenieWish'
  | 'spendGenieWish'
  | 'squirrelWish';

export const EFFECTS: Record<EffectId, EffectDef> = {
  unlockJournal: {
    kind: 'unlockFeature',
    feature: 'journal',
    title: 'Journal',
    description: 'Unlocks the Journal.',
  },
  unlockPet: {
    kind: 'unlockFeature',
    feature: 'pet',
    title: 'Pet',
    description: 'Unlocks the Pet pane.',
  },
  // Freezing distance means the signal map.svelte.ts samples at spawn time
  // doesn't move either, so pickEncounter() deterministically hands back
  // the same monster - no separate "pinned monster id" needed, this just
  // rides the existing determinism (see engine.ts's decideNextEncounter()).
  freezeSpawn: {
    kind: 'freezeSpawn',
    duration: 60_000,
    title: 'Déjà Vu',
    description: 'Locks the current stretch in place for 60 seconds.',
  },
  permanentDamageBoost: {
    kind: 'grantModifier',
    modifier: { stat: 'damage', value: 1 },
    title: 'Well-Read',
    description: 'Permanently +1 damage.',
  },
  eatChicken: {
    kind: 'grantXp',
    amount: 5,
    title: 'Eat',
    description: "Best not to ask. +5 XP either way.",
  },
  summonGenie: {
    kind: 'launchEncounter',
    encounterId: 'genie',
    guardFlag: 'genieWishGranted',
    title: 'Corked Bottle',
    description: 'Something answers. No refunds.',
  },
  grantGenieWish: {
    kind: 'grantItem',
    itemId: 'wishAsIs',
    title: 'Wish Granted',
    description: 'As advertised. Roughly.',
  },
  // Fired by whichever genie dialog node actually spends the wish
  // (genie:item, genie:lore, genie:granted) - genie:nevermind fires nothing,
  // so the bottle it's still holding stays the real, reusable corkedBottle.
  spendGenieWish: {
    kind: 'swapItem',
    from: 'corkedBottle',
    to: 'emptyCorkedBottle',
    title: 'Wish Spent',
    description: 'The bottle goes quiet.',
  },
  squirrelWish: {
    kind: 'grantItem',
    itemId: 'lifetimeAcorns',
    title: 'Acorn Wish',
    description: "The squirrel's, not yours.",
  },
};
