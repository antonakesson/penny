import type { FeatureId } from './features';

interface EffectBase {
  title: string;
  description: string;
}

export type EffectDef = EffectBase &
  (
    | { kind: 'unlockFeature'; feature: FeatureId }
    | { kind: 'freezeSpawn'; duration: number } // ms, wall-clock
    | { kind: 'additiveDamage'; amount: number }
  );

export const EFFECTS = {
  unlockBestiary: {
    kind: 'unlockFeature',
    feature: 'bestiary',
    title: 'Bestiary',
    description: 'Unlocks the Bestiary.',
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
  devDamage: {
    kind: 'additiveDamage',
    amount: 10,
    title: 'Requisitioned',
    description: '+10 damage. Dev-only, never dropped.',
  },
} as const satisfies Record<string, EffectDef>;

export type EffectId = keyof typeof EFFECTS;
