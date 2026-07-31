import { EFFECTS, type EffectDef, type EffectId } from '../data/effects';
import { ITEMS, type ItemId, type ItemDef } from '../data/loot';
import { getInventory } from './inventory.svelte';
import { unlockFeature } from './features.svelte';
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

// Feeds a future buff-bar UI.
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
    case 'additiveDamage':
      return; // passive-only kind, never reached via triggerEffect
    default:
      assertNever(def);
  }
}

// Pure query, no state of its own - lives here so engine.ts has one facade
// for everything effect-related, not two.
export function getPassiveBonus(kind: 'additiveDamage'): number {
  const inv = getInventory();
  let total = 0;
  for (const itemId of Object.keys(inv) as ItemId[]) {
    if ((inv[itemId] ?? 0) <= 0) continue;
    const passiveId = (ITEMS[itemId] as ItemDef).passive;
    if (!passiveId) continue;
    const def = EFFECTS[passiveId];
    if (def.kind === kind) total += def.amount;
  }
  return total;
}

export function serializeEffects(): Partial<Record<EffectId, number>> {
  return activeExpiries;
}

export function hydrateEffects(value: Partial<Record<EffectId, number>>) {
  activeExpiries = value;
}
