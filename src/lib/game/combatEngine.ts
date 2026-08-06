import { PET } from './config';
import { getEncounter, damageMonster, killMonster } from './state/encounter.svelte';
import { advance } from './state/map.svelte';
import { getPet, setPetAttacking, setPetRecovering, setPetIdle } from './state/pet.svelte';
import { addXp } from './state/xp.svelte';
import { addItem, getInventory } from './state/inventory.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS, ITEM_CAP, type ItemId } from './data/loot';
import { isFeatureUnlocked } from './state/features.svelte';
import { isEffectActive } from './state/effect.svelte';
import { sumModifier } from './state/modifier.svelte';
import { playSound } from './audio';
import type { Monster, Investigation } from './types';
import * as journal from './journal';

// What the player does to an encounter isn't here any more - attack and
// investigate are skills now (data/skills.ts), resolved by engine.ts's one
// activation state machine instead of the per-kind handlers this file used
// to carry. What's left is the two things that were never player input: the
// pet, which swings on its own timer, and what a death is worth.

// Runs entirely independent of the player's own activation - the pet keeps
// swinging through a cast, a channel, or nothing at all.
export function runPetTick() {
  if (!isFeatureUnlocked('pet')) return;
  const pet = getPet();
  const now = Date.now();

  if (pet.status === 'idle') {
    if (!isPetTargetable()) return;
    setPetAttacking(now);
    return;
  }

  if (pet.status === 'attacking') {
    if (now - (pet.startedAt ?? 0) < PET.activeMs) return;
    setPetRecovering(now);
    if (!isPetTargetable()) return;
    const damage = PET.damage + sumModifier('petDamage');
    spawnFloatingText(`-${damage}`, 'damage');
    damageMonster(damage);
    return;
  }

  if (now - (pet.startedAt ?? 0) >= PET.recoveryMs) setPetIdle();
}

function isPetTargetable(): boolean {
  const encounter = getEncounter();
  if (encounter.action === 'social' || encounter.action === 'crossroad') return false;
  return encounter.status === 'active' && encounter.hp > 0;
}

// The single place a death is noticed, called once per tick after every
// damage source has had its turn (see engine.ts's tick()). Previously each
// source re-checked hp itself - the skill path and the pet path carried the
// same three lines. Only the hp-drain kinds reach here; Social gets its own
// resolveDialogChoice()/dismissDialog() in dialogEngine.ts.
export function resolveEncounterDeath() {
  const encounter = getEncounter();
  if (encounter.action === 'social' || encounter.action === 'crossroad') return;
  if (encounter.status !== 'active' || encounter.hp > 0) return;
  resolveKill(encounter);
}

function isAtItemCap(itemId: ItemId): boolean {
  const cap = ITEM_CAP[itemId];
  return cap !== undefined && (getInventory()[itemId] ?? 0) >= cap;
}

function awardLoot(dropTableId: readonly string[]) {
  const drops = resolveDropIds(dropTableId, isAtItemCap);
  playSound(drops.length > 0 ? 'LootDropped' : 'LootEmpty');
  for (const dropId of drops) {
    addItem(dropId, 1);
    spawnLootText(`+1 ${ITEMS[dropId].name}`, ITEMS[dropId].rarity);
    journal.itemDropped(dropId);
  }
}

function resolveKill(encounter: Monster | Investigation) {
  addXp(encounter.xpReward);
  awardLoot(encounter.dropTableId);
  journal.encounterCompleted(encounter.id);
  killMonster();
  if (!isEffectActive('freezeSpawn')) advance();
}
