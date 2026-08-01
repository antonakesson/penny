import type { FeatureId } from './features';
import type { Modifier } from './modifiers';
import type { EncounterId } from './encounters';
import type { ItemId } from './loot';

interface EffectBase {
  title: string;
  description: string;
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
  );

export const EFFECTS = {
  unlockBestiary: {
    kind: 'unlockFeature',
    feature: 'bestiary',
    title: 'Bestiary',
    description: 'Unlocks the Bestiary.',
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
    title: 'Corked Bottle',
    description: 'Something answers. No refunds.',
  },
  grantGenieWish: {
    kind: 'grantItem',
    itemId: 'wishAsIs',
    title: 'Wish Granted',
    description: 'As advertised. Roughly.',
  },
  squirrelWish: {
    kind: 'grantItem',
    itemId: 'lifetimeAcorns',
    title: 'Acorn Wish',
    description: "The squirrel's, not yours.",
  },
} as const satisfies Record<string, EffectDef>;

export type EffectId = keyof typeof EFFECTS;
