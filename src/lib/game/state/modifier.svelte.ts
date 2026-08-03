import { ITEMS, type ItemId, type ItemDef } from '../data/loot';
import { getInventory } from './inventory.svelte';
import type { StatId, Modifier } from '../data/modifiers';

// Unlike passives below, these outlive the item that granted them.
let permanentModifiers = $state<Modifier[]>([]);

export function grantModifier(modifier: Modifier) {
  permanentModifiers = [...permanentModifiers, modifier];
}

// Pure inventory scan, no state of its own - exists exactly while the
// granting item's count > 0.
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
