import { ACTION, INVESTIGATE, PET } from './config';
import { getEncounter, damageMonster, killMonster } from './state/encounter.svelte';
import { advance } from './state/map.svelte';
import { markEventFired } from './state/events.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { getPet, setPetAttacking, setPetRecovering, setPetIdle } from './state/pet.svelte';
import { addXp, getLevel } from './state/xp.svelte';
import { addItem, getInventory } from './state/inventory.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { spawnXpFloatingText } from './state/xpFloatingText.svelte';
import { resolveDropIds, ITEMS, ITEM_CAP, type ItemId } from './data/loot';
import { isFeatureUnlocked } from './state/features.svelte';
import { isEffectActive } from './state/effect.svelte';
import { sumModifier } from './state/modifier.svelte';
import { assertNever } from './util/assertNever';
import { playSound } from './audio';
import type { Monster, Investigation, ActionKind } from './types';
import * as journal from './journal';

// Attack and investigate share one ActionState mutex - the player can never
// do both at once. A handler only owns WHEN a hit lands; HOW MUCH is
// damageForKind() below.
interface ActionHandler {
  onDown(): boolean;
  onUp(): boolean;
  tick(): boolean;
}

const attackHandler: ActionHandler = {
  onDown() {
    const action = getAction();
    if (action.status !== 'idle') return false;
    const monster = getEncounter();
    if (monster.status !== 'active') return false;
    setActionActive('attack', Date.now());
    return false;
  },
  // A swing commits once started - attack has never cared about release.
  onUp() {
    return false;
  },
  tick() {
    const action = getAction();
    if (action.startedAt === null) return false;
    const elapsed = Date.now() - action.startedAt;
    if (action.status === 'active') {
      if (elapsed < ACTION.activeMs) return false;
      setActionCooldown(Date.now());
      return true;
    }
    if (action.status === 'cooldown' && elapsed >= ACTION.cooldownMs) setActionIdle();
    return false;
  },
};

const investigateHandler: ActionHandler = {
  onDown() {
    const action = getAction();
    if (action.status !== 'idle') return false;
    const monster = getEncounter();
    if (monster.status !== 'active') return false;
    resetInvestigationDamageTimer();
    setActionActive('investigate', Date.now());
    return false;
  },
  onUp() {
    const action = getAction();
    if (action.kind === 'investigate' && action.status === 'active') setActionIdle();
    return false;
  },
  // Whether this actually lands a nonzero hit is decided by
  // calculateInvestigationDamage()'s rate/carry math, not here.
  tick() {
    const action = getAction();
    return action.kind === 'investigate' && action.status === 'active';
  },
};

// null for kinds that don't use the mutex - Social's card calls the resolve
// function directly instead of going through press()/release()/runCombatTick().
function currentHandler(): ActionHandler | null {
  const action = getEncounter().action;
  if (action === 'attack') return attackHandler;
  if (action === 'investigate') return investigateHandler;
  return null;
}

export function calculateDamage(): number {
  return getLevel() + sumModifier('damage');
}

// Rate-based (INVESTIGATE.dps), not a flat per-call amount - at 4 dps and a
// 100ms tick that's 0.4 HP/call, so the remainder carries forward until it
// crosses a whole point instead of rounding to 0 forever.
let investigationLastAppliedAt: number | null = null;
let investigationCarry = 0;

function resetInvestigationDamageTimer() {
  investigationLastAppliedAt = null;
  investigationCarry = 0;
}

function calculateInvestigationDamage(): number {
  const now = Date.now();
  if (investigationLastAppliedAt === null) {
    investigationLastAppliedAt = now;
    return 0;
  }
  const deltaMs = now - investigationLastAppliedAt;
  investigationLastAppliedAt = now;
  const exact = investigationCarry + (deltaMs / 1000) * INVESTIGATE.dps;
  const whole = Math.floor(exact);
  investigationCarry = exact - whole;
  return whole;
}

function damageForKind(kind: ActionKind): number {
  switch (kind) {
    case 'attack':
      return calculateDamage();
    case 'investigate':
      return calculateInvestigationDamage();
    default:
      return assertNever(kind);
  }
}

function applyHit() {
  const encounter = getEncounter();
  // Social never reaches here - currentHandler() returns null for it.
  if (encounter.action === 'social') return;
  // A dead monster can't be hit again - investigate's continuous hold would
  // otherwise keep re-triggering resolveKill() every tick until the next
  // encounter spawns.
  if (encounter.status !== 'active') return;
  const damage = damageForKind(encounter.action);
  if (damage <= 0) return;
  spawnFloatingText(`-${damage}`, 'damage');
  damageMonster(damage);
  if (encounter.hp <= 0) resolveKill(encounter);
}

export function press() {
  if (currentHandler()?.onDown()) applyHit();
}

export function release() {
  if (currentHandler()?.onUp()) applyHit();
}

// Runs alongside currentHandler()'s tick, never through it - the pet keeps
// swinging independent of the player's own action.
function petTick() {
  if (!isFeatureUnlocked('pet')) return;
  const pet = getPet();
  const now = Date.now();

  if (pet.status === 'idle') {
    const encounter = getEncounter();
    if (encounter.action === 'social' || encounter.status !== 'active') return;
    setPetAttacking(now);
    return;
  }

  if (pet.status === 'attacking') {
    if (now - (pet.startedAt ?? 0) < PET.activeMs) return;
    setPetRecovering(now);
    const encounter = getEncounter();
    if (encounter.action === 'social' || encounter.status !== 'active') return;
    const damage = PET.damage + sumModifier('petDamage');
    spawnFloatingText(`-${damage}`, 'damage');
    damageMonster(damage);
    if (encounter.hp <= 0) resolveKill(encounter);
    return;
  }

  if (now - (pet.startedAt ?? 0) >= PET.recoveryMs) setPetIdle();
}

// engine.ts's tick() calls this for the attack/investigate/pet mechanics,
// then separately declares what a resulting kill means for the encounter
// queue (drop/decide-next/spawn) - that lifecycle sequencing has nothing to
// do with combat resolution, so it stays there instead of here.
export function runCombatTick() {
  if (currentHandler()?.tick()) applyHit();
  petTick();
}

function awardXp(amount: number) {
  addXp(amount);
  spawnXpFloatingText(amount);
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

// Only the hp-drain kinds resolve through here - Social gets its own
// resolveDialogChoice()/dismissDialog() in dialogEngine.ts.
function resolveKill(encounter: Monster | Investigation) {
  awardXp(encounter.xpReward);
  awardLoot(encounter.dropTableId);
  markEventFired(encounter.id);
  journal.encounterCompleted(encounter.id);
  killMonster();
  if (!isEffectActive('freezeSpawn')) advance();
}
