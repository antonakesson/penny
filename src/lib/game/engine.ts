import { ACTION, ENCOUNTER_END_MS, SPAWN_FREEZE_KILLS, INVESTIGATE } from './config';
import { getEncounter, damageMonster, killMonster, spawn } from './state/encounter.svelte';
import { advance } from './state/map.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp, getLevel } from './state/xp.svelte';
import { addItem, removeItem } from './state/inventory.svelte';
import { discoverMonster } from './state/bestiary.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { spawnXpFloatingText } from './state/xpFloatingText.svelte';
import { resolveDropIds, ITEMS, type ItemId, type ItemDef } from './data/loot';
import { ITEM_ACTIONS, type ItemActionId } from './data/itemActions';
import { unlockFeature } from './state/features.svelte';
import { startSpawnFreeze, consumeSpawnFreeze } from './state/spawnFreeze.svelte';
import { assertNever } from './util/assertNever';
import { playSound } from './audio';
import type { Monster } from './types';
import type { EncounterAction } from './data/monstats';

// Attack and investigate are mutually exclusive activities on the same
// "self" occupant - they share one ActionState mutex (kind-tagged) rather
// than each getting an independent slice. See architecture_state_ownership
// memory: independent slices are for genuinely concurrent occupants (a
// future mercenary acting alongside the player), not two things the player
// can never do at once.
//
// A handler only owns WHEN - it signals whether a hit landed this call,
// nothing about how much it's worth. HOW MUCH is engine.ts's job alone
// (damageForKind() below), so a future stats/talent/equipment layer has
// exactly one place to plug into per kind, not one per handler.
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
  // Asks to be evaluated every 100ms tick while held (KISS over batching
  // into chunkier hits) - whether that actually lands a nonzero hit is
  // decided by calculateInvestigationDamage()'s own rate/carry math, not
  // here. Rapid small hits stacking up is the point: instantly tactile
  // feedback that you're actively digging, not spam to suppress.
  tick() {
    const action = getAction();
    return action.kind === 'investigate' && action.status === 'active';
  },
};

function currentHandler(): ActionHandler {
  return getEncounter().action === 'investigate' ? investigateHandler : attackHandler;
}

// Base damage is just the character's level for now - no equipment or
// talent modifiers exist yet to layer on top.
export function calculateDamage(): number {
  return getLevel();
}

// Real-time-rate based, not a flat per-call amount - INVESTIGATE.dps is an
// honest "N damage per second" balance knob, decoupled from how often
// tick() happens to fire (App.svelte's setInterval cadence is an
// implementation detail, not a design number). At 4 dps and a 100ms tick
// that's 0.4 HP/call, so a bare floor() would round to 0 forever; the
// remainder carries forward until it crosses a whole point. No
// player-facing stat to scale off yet - its own function anyway (mirroring
// calculateDamage()) so a future search-speed stat/talent has the same
// seam to land in later.
let investigationLastAppliedAt: number | null = null;
let investigationCarry = 0;

function resetInvestigationDamageTimer() {
  investigationLastAppliedAt = null;
  investigationCarry = 0;
}

export function calculateInvestigationDamage(): number {
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

function damageForKind(kind: EncounterAction): number {
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
  const monster = getEncounter();
  // A dead monster can't be hit again. Attack never hit this case because
  // resolving a swing always leaves ActionState in 'cooldown', which its
  // own tick() guard already blocks - but investigate's continuous hold
  // deliberately keeps 'active' running for as long as the pointer is
  // down, so without this check a kill mid-hold kept re-triggering
  // resolveKill() every tick until the next encounter spawned (and
  // killMonster() resetting diedAt each time kept postponing that, too).
  if (monster.status !== 'active') return;
  const damage = damageForKind(monster.action);
  if (damage <= 0) return;
  spawnFloatingText(`-${damage}`, 'damage');
  damageMonster(damage);
  if (monster.hp <= 0) resolveKill(monster);
}

export function press() {
  if (currentHandler().onDown()) applyHit();
}

export function release() {
  if (currentHandler().onUp()) applyHit();
}

export function tick() {
  if (currentHandler().tick()) applyHit();

  const monster = getEncounter();
  const now = Date.now();
  // Discovery is logged as soon as the monster is on screen, not on kill —
  // a no-op past the first tick it's seen, since discoverMonster just sets
  // a bit.
  discoverMonster(monster.entryNo);

  if (monster.status === 'dead' && monster.diedAt !== null && now - monster.diedAt >= ENCOUNTER_END_MS) {
    // Reset the shared mutex before the next encounter's kind takes over -
    // otherwise a stale cooldown/active status can bleed across the
    // respawn boundary into a differently-kinded encounter.
    setActionIdle();
    spawn();
  }
}

function awardLoot(dropTableId: readonly string[], xpReward: number) {
  const drops = resolveDropIds(dropTableId);
  awardXp(xpReward);
  spawnXpFloatingText(xpReward);
  playSound(drops.length > 0 ? 'LootDropped' : 'LootEmpty');
  for (const dropId of drops) {
    addItem(dropId, 1);
    spawnLootText(`+1 ${ITEMS[dropId].name}`, ITEMS[dropId].rarity);
  }
}

export function useItem(itemId: ItemId) {
  const actionId = (ITEMS[itemId] as ItemDef).action;
  if (!actionId) return;
  applyItemAction(actionId);
  if (ITEM_ACTIONS[actionId].consumes) removeItem(itemId, 1);
}

function applyItemAction(actionId: ItemActionId) {
  switch (actionId) {
    case 'unlockBestiary':
      unlockFeature('bestiary');
      return;
    case 'freezeSpawn':
      startSpawnFreeze(SPAWN_FREEZE_KILLS);
      return;
    default:
      assertNever(actionId);
  }
}

function resolveKill(monster: Monster) {
  awardLoot(monster.dropTableId, monster.xpReward);
  killMonster();
  if (!consumeSpawnFreeze()) advance();
}
