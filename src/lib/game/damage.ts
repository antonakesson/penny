import { getLevel } from './state/xp.svelte';
import { sumModifier } from './state/modifier.svelte';

// Its own module rather than combatEngine.ts's, where this used to live -
// state/effect.svelte.ts's damageEncounter case needs it, and combatEngine
// already imports isEffectActive() back out of effect.svelte.ts, so leaving
// it there would make the two modules import each other. Nothing here reads
// combat state; it's a pure read of level + modifiers.
export function calculateDamage(): number {
  return getLevel() + sumModifier('damage');
}
