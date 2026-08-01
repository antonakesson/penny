import type { FeatureId } from './features';
import type { Modifier } from './modifiers';

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
} as const satisfies Record<string, EffectDef>;

export type EffectId = keyof typeof EFFECTS;
