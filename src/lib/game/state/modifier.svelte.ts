import { ITEMS, type ItemId, type ItemDef } from '../data/loot';
import { getInventory } from './inventory.svelte';
import type { StatId, Modifier } from '../data/modifiers';

// The only real state in this module - a running total that only ever
// grows, added to by grantModifier() (called from EFFECTS' grantModifier
// kind, e.g. a consumed book). Unlike passives below, these outlive the
// item that granted them.
let permanentModifiers = $state<Modifier[]>([]);

export function grantModifier(modifier: Modifier) {
  permanentModifiers = [...permanentModifiers, modifier];
}

// Pure inventory scan, no state of its own - exists exactly while the
// granting item's count > 0. Same pattern as effect.svelte.ts's old
// getPassiveBonus(), generalized from one hardcoded stat to any StatId.
function getPassiveModifiers(): Modifier[] {
  const inv = getInventory();
  const mods: Modifier[] = [];
  for (const itemId of Object.keys(inv) as ItemId[]) {
    if ((inv[itemId] ?? 0) <= 0) continue;
    const passive = (ITEMS[itemId] as ItemDef).passive;
    if (passive) mods.push(...passive);
  }
  return mods;
}

// The one aggregation point every gameplay formula reads through -
// engine.ts's calculateDamage() etc. combine this with non-modifier inputs
// (getLevel()); this function itself has no opinion about what a stat is
// for, only how to sum whoever currently contributes to it.
export function sumModifier(stat: StatId): number {
  const all = [...getPassiveModifiers(), ...permanentModifiers];
  return all.filter((m) => m.stat === stat).reduce((total, m) => total + m.value, 0);
}

export function serializeModifiers(): Modifier[] {
  return permanentModifiers;
}

export function hydrateModifiers(value: Modifier[]) {
  permanentModifiers = value;
}
