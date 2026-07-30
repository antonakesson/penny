import { ACTION, ENCOUNTER_END_MS, SPAWN_FREEZE_KILLS, INVESTIGATE } from './config';
import { getEncounter, createEncounter, damageMonster, killMonster, spawn } from './state/encounter.svelte';
import { advance } from './state/map.svelte';
import { pickEncounter, pickLevel } from './data/zones';
import { getCurrentZoneId } from './state/zone.svelte';
import { shouldShowEvent, markEventFired } from './state/events.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp, getLevel } from './state/xp.svelte';
import { addItem, removeItem } from './state/inventory.svelte';
import { discoverMonster } from './state/bestiary.svelte';
import { getBestiaryEntry } from './data/bestiary';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { spawnXpFloatingText } from './state/xpFloatingText.svelte';
import { resolveDropIds, ITEMS, type ItemId, type ItemDef } from './data/loot';
import { ITEM_ACTIONS, type ItemActionId } from './data/itemActions';
import { unlockFeature, isFeatureUnlocked } from './state/features.svelte';
import { startSpawnFreeze, consumeSpawnFreeze } from './state/spawnFreeze.svelte';
import { assertNever } from './util/assertNever';
import { playSound } from './audio';
import type { Encounter, Monster, Investigation, ActionKind } from './types';
import type { EncounterId } from './data/encounters';

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

// null for any kind that doesn't use the ActionState mutex at all -
// RabbidSquirrel's discrete click-to-pick, for one (see ENCOUNTER_REFACTOR.md
// decision 1). Its card calls the resolve function directly instead of going
// through press()/release()/tick().
function currentHandler(): ActionHandler | null {
  const action = getEncounter().action;
  if (action === 'attack') return attackHandler;
  if (action === 'investigate') return investigateHandler;
  return null;
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
  // RabbidSquirrel never reaches here - currentHandler() returns null for
  // it, so nothing ever calls applyHit() while it's current. Narrows the
  // rest of this function to the hp-drain kinds.
  if (encounter.action === 'rabbidSquirrel') return;
  // A dead monster can't be hit again. Attack never hit this case because
  // resolving a swing always leaves ActionState in 'cooldown', which its
  // own tick() guard already blocks - but investigate's continuous hold
  // deliberately keeps 'active' running for as long as the pointer is
  // down, so without this check a kill mid-hold kept re-triggering
  // resolveKill() every tick until the next encounter spawned (and
  // killMonster() resetting diedAt each time kept postponing that, too).
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

export function tick() {
  if (currentHandler()?.tick()) applyHit();

  const encounter = getEncounter();
  const now = Date.now();
  // Discovery is logged as soon as the monster is on screen, not on kill —
  // a no-op past the first tick it's seen, since discoverMonster just sets
  // a bit. Gated on the Bestiary unlock itself: there's no journal to log
  // into before that, so nothing should get marked seen ahead of it. Only
  // bestiary-listed encounters have anything to log — one-shot events and
  // placeholders just aren't species in the pokedex.
  const bestiaryEntry = getBestiaryEntry(encounter.name);
  if (bestiaryEntry && isFeatureUnlocked('bestiary')) discoverMonster(bestiaryEntry.entryNo);

  if (encounter.status === 'dead' && encounter.diedAt !== null && now - encounter.diedAt >= ENCOUNTER_END_MS) {
    // Reset the shared mutex before the next encounter's kind takes over -
    // otherwise a stale cooldown/active status can bleed across the
    // respawn boundary into a differently-kinded encounter.
    setActionIdle();
    spawn(decideNextEncounter());
  }
}

// Priority: a spawn-freeze charge held on this kill forces an exact replay
// of the same encounter (bridged from resolveKill(), captured at kill time -
// see replayEncounterId below for why it can't be re-derived here from
// getSpawnFreezeRemaining() alone); otherwise an eligible event takes over;
// otherwise the normal weighted zone pick.
function decideNextEncounter(): Encounter {
  if (replayEncounterId !== null) {
    const id = replayEncounterId;
    replayEncounterId = null;
    // Distance is held still by the same freeze, so the difficulty signal
    // resamples to the same value - re-picking here (rather than reusing a
    // stashed level) rides that determinism instead of duplicating it.
    return createEncounter(id, pickLevel(getCurrentZoneId()));
  }
  const eventEncounterId = shouldShowEvent();
  if (eventEncounterId) return createEncounter(eventEncounterId);
  const zoneId = getCurrentZoneId();
  return createEncounter(pickEncounter(zoneId), pickLevel(zoneId));
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

// Bridges kill-time -> spawn-time (500ms later, ENCOUNTER_END_MS): must be
// captured once here, not re-derived from getSpawnFreezeRemaining() at
// decideNextEncounter() time, since the charge for *this* kill is already
// consumed by then - a fresh read there would miss the last covered kill
// in a freeze streak.
let replayEncounterId: EncounterId | null = null;

// Only the hp-drain kinds resolve through here - RabbidSquirrel gets its own
// resolveRabbidSquirrelPick() below, since "loot + xp" doesn't fit what a
// discrete choice grants.
function resolveKill(encounter: Monster | Investigation) {
  awardLoot(encounter.dropTableId, encounter.xpReward);
  markEventFired(encounter.id);
  const wasFrozen = consumeSpawnFreeze();
  replayEncounterId = wasFrozen ? (encounter.id as EncounterId) : null;
  killMonster();
  if (!wasFrozen) advance();
}

// Placeholder resolution - the real Recruit Pet stages (Bribe/Shoo, pet
// grant, decline) are a follow-up; this just proves a non-hp-drain kind can
// resolve outside the attack/investigate path at all. Triggered by
// <RabbidSquirrelCard/>'s button, not by applyHit() - RabbidSquirrel never
// enters that path (see currentHandler()).
export function resolveRabbidSquirrelPick() {
  const encounter = getEncounter();
  if (encounter.action !== 'rabbidSquirrel' || encounter.status !== 'active') return;
  killMonster();
  advance();
}
