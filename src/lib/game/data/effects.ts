import type { FeatureId } from './features';
import type { Modifier } from './modifiers';
import type { EncounterId } from './encounters';
import type { ItemId } from './loot';
import type { FlagId } from './journalFlags';
import type { Condition } from './condition';

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
    // bonus is additive, evaluated at the moment the effect fires (not
    // baked in at spawn/authoring time like combatEngine's difficulty
    // scale) - for a reward that's mostly flat but should read as noticing
    // something the player did. Generic on Condition rather than a
    // one-off "lingered" field, so the next thing that wants a
    // conditional bonus (any flag/item/feature check) doesn't need its
    // own mechanism.
    | { kind: 'grantXp'; amount: number; bonus?: { when: Condition; amount: number } }
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
  | 'grantJumpXp'
  | 'summonGenie'
  | 'openCorkedBottle'
  | 'closeCorkedBottle'
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
  // Fired unconditionally by unpromptedCreek:jump - the jump always
  // happens regardless of path taken to get there, so this is a flat style
  // bonus, not a reward for solving anything. The bonus only exists to give
  // the `lingered` flag (see journalFlags.ts) somewhere to be read back.
  grantJumpXp: {
    kind: 'grantXp',
    amount: 20,
    bonus: { when: { kind: 'flag', flag: 'lingered' }, amount: 10 },
    title: 'Stuck the Landing',
    description: 'The creek was not, in fact, timing you.',
  },
  summonGenie: {
    kind: 'launchEncounter',
    encounterId: 'genie',
    guardFlag: 'genieWishGranted',
    title: 'Corked Bottle',
    description: 'Something answers. No refunds.',
  },
  // Fired alongside summonGenie, off the same click (see corkedBottle's
  // array action in loot.ts) - the bottle goes inert the instant the genie's
  // out, so a second click while the dialog's still open has no `action` to
  // fire at all. That's what actually stops a spam-click from stacking
  // duplicate genies; summonGenie's own guardFlag only covers "wish already
  // spent," not "genie currently mid-conversation." Carries the same
  // guardFlag as summonGenie so the pair stays atomic - if the encounter
  // didn't launch, the item shouldn't go inert either (a stray corkedBottle
  // that outlives its wish, e.g. via DevTools, would otherwise brick itself
  // with no genie to have ever popped it open).
  openCorkedBottle: {
    kind: 'swapItem',
    from: 'corkedBottle',
    to: 'openedCorkedBottle',
    guardFlag: 'genieWishGranted',
    title: 'Cork Popped',
    description: 'Something is currently answering.',
  },
  // Fired from genie:nevermind - the one path that resolves the encounter
  // without spending the wish, so the bottle un-opens and is real,
  // clickable corkedBottle again.
  closeCorkedBottle: {
    kind: 'swapItem',
    from: 'openedCorkedBottle',
    to: 'corkedBottle',
    title: 'Cork Replaced',
    description: 'Back in its bottle. For now.',
  },
  grantGenieWish: {
    kind: 'grantItem',
    itemId: 'wishAsIs',
    title: 'Wish Granted',
    description: 'As advertised. Roughly.',
  },
  // Fired by whichever genie dialog node actually spends the wish
  // (genie:item, genie:lore, genie:granted) - from openedCorkedBottle, not
  // corkedBottle, since by the time a wish resolves openCorkedBottle has
  // already swapped the held item over. genie:nevermind fires
  // closeCorkedBottle instead of this, so a declined wish reverts to the
  // real, reusable corkedBottle rather than going inert.
  spendGenieWish: {
    kind: 'swapItem',
    from: 'openedCorkedBottle',
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
