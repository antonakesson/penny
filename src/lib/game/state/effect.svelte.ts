import { EFFECTS, type EffectDef, type EffectId } from '../data/effects';
import { unlockFeature } from './features.svelte';
import { grantModifier } from './modifier.svelte';
import { createEncounter, interruptEncounter } from './encounter.svelte';
import { setActionIdle } from './action.svelte';
import { addItem, removeItem } from './inventory.svelte';
import { addXp } from './xp.svelte';
import { hasFlag } from './journalFlags.svelte';
import { evaluateCondition } from '../condition';
import { assertNever } from '../util/assertNever';

let activeExpiries = $state<Partial<Record<EffectId, number>>>({});

export function triggerEffect(effectId: EffectId) {
  const def: EffectDef = EFFECTS[effectId];
  if (def.guardFlag && hasFlag(def.guardFlag)) return;
  if ('duration' in def) {
    activeExpiries[effectId] = Date.now() + def.duration;
  }
  applyInstantEffect(def);
}

export function isEffectActive(effectId: EffectId): boolean {
  const expiresAt = activeExpiries[effectId];
  return expiresAt !== undefined && Date.now() < expiresAt;
}

// Timed effects only - passive/permanent modifiers are read separately via
// sumModifier() in state/modifier.svelte.ts.
export function getActiveEffects(): { id: EffectId; remainingMs: number }[] {
  const now = Date.now();
  return (Object.entries(activeExpiries) as [EffectId, number][])
    .filter(([, expiresAt]) => now < expiresAt)
    .map(([id, expiresAt]) => ({ id, remainingMs: expiresAt - now }));
}

function applyInstantEffect(def: EffectDef) {
  switch (def.kind) {
    case 'unlockFeature':
      unlockFeature(def.feature);
      return;
    case 'freezeSpawn':
      return; // nothing else to do - presence in activeExpiries IS the effect
    case 'grantModifier':
      grantModifier(def.modifier);
      return;
    case 'launchEncounter':
      // Mutex reset so a mid-swing cooldown doesn't bleed into the
      // interrupting encounter. Whatever was active is paused, not lost.
      setActionIdle();
      interruptEncounter(createEncounter(def.encounterId));
      return;
    case 'grantItem':
      addItem(def.itemId, 1);
      return;
    case 'grantXp': {
      const bonus = def.bonus && evaluateCondition(def.bonus.when) ? def.bonus.amount : 0;
      addXp(def.amount + bonus);
      return;
    }
    case 'swapItem':
      removeItem(def.from, 1);
      addItem(def.to, 1);
      return;
    default:
      assertNever(def);
  }
}

export function serializeEffects(): Partial<Record<EffectId, number>> {
  return activeExpiries;
}

export function hydrateEffects(value: Partial<Record<EffectId, number>>) {
  activeExpiries = value;
}
