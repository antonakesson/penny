import { EFFECTS, type EffectDef, type EffectId } from '../data/effects';
import { unlockFeature } from './features.svelte';
import { grantModifier } from './modifier.svelte';
import { createEncounter, interruptEncounter } from './encounter.svelte';
import { setActionIdle } from './action.svelte';
import { addItem } from './inventory.svelte';
import { addXp } from './xp.svelte';
import { assertNever } from '../util/assertNever';

let activeExpiries = $state<Partial<Record<EffectId, number>>>({});

// Caller-agnostic on purpose - items are the first caller (via useItem()),
// not the only one. A monster's onHit or a story event can call this the
// same way once a real example exists.
export function triggerEffect(effectId: EffectId) {
  const def: EffectDef = EFFECTS[effectId];
  if ('duration' in def) {
    activeExpiries[effectId] = Date.now() + def.duration;
  }
  applyInstantEffect(def);
}

// Pure comparison against Date.now() - immune to tick cadence/drift the
// same way calculateInvestigationDamage() already is. No decrementing
// counter exists to desync.
export function isEffectActive(effectId: EffectId): boolean {
  const expiresAt = activeExpiries[effectId];
  return expiresAt !== undefined && Date.now() < expiresAt;
}

// Timed effects only - passive/permanent modifiers are a different display
// concern (Character.svelte reads those straight off sumModifier() in
// state/modifier.svelte.ts instead, since they're an aggregated number, not
// a named, individually-expiring thing).
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
      // Cuts in immediately, doesn't wait a turn - obvious haptics on item
      // use beats a delayed payoff that reads as bugged. Whatever was
      // active is paused, not lost (see interruptEncounter()). Mutex reset
      // mirrors tick()'s own death-transition reset in engine.ts - without
      // it a mid-swing cooldown against the paused encounter would bleed
      // into the interrupting one, which never even uses the mutex if it's
      // a Social. Level omitted - createEncounter() defaults to the def's
      // own authored level, no zone/distance scaling for an effect-launched
      // encounter (see EffectDef's comment).
      setActionIdle();
      interruptEncounter(createEncounter(def.encounterId));
      return;
    case 'grantItem':
      addItem(def.itemId, 1);
      return;
    case 'grantXp':
      addXp(def.amount);
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
