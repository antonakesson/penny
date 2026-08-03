import { ACTION, ENCOUNTER_END_MS, INVESTIGATE, PET } from './config';
import {
  getEncounter,
  createEncounter,
  damageMonster,
  killMonster,
  interruptEncounter,
  dropEncounter,
  hasEncounter,
  pickDialogChoice,
} from './state/encounter.svelte';
import { getDialogNode, type DialogNodeId, type DialogNode, type DialogChoice } from './data/dialog';
import { evaluateCondition } from './condition';
import { advance } from './state/map.svelte';
import { pickEncounter } from './data/zones';
import { getCurrentZoneId } from './state/zone.svelte';
import { shouldShowEvent, markEventFired } from './state/events.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { getPet, setPetAttacking, setPetRecovering, setPetIdle } from './state/pet.svelte';
import { addXp, getLevel } from './state/xp.svelte';
import { addItem, removeItem, getInventory } from './state/inventory.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { spawnXpFloatingText } from './state/xpFloatingText.svelte';
import { resolveDropIds, ITEMS, ITEM_CAP, type ItemId, type ItemDef } from './data/loot';
import { isFeatureUnlocked } from './state/features.svelte';
import { triggerEffect, isEffectActive } from './state/effect.svelte';
import { sumModifier } from './state/modifier.svelte';
import { assertNever } from './util/assertNever';
import { playSound } from './audio';
import type { Encounter, Monster, Investigation, ActionKind } from './types';
import type { EncounterId } from './data/encounters';
import * as journal from './journal';

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

// null for any kind that doesn't use the ActionState mutex at all - Social's
// discrete click-to-pick, for one (see ENCOUNTER_REFACTOR.md decision 1).
// Its card calls the resolve function directly instead of going through
// press()/release()/tick().
function currentHandler(): ActionHandler | null {
  const action = getEncounter().action;
  if (action === 'attack') return attackHandler;
  if (action === 'investigate') return investigateHandler;
  return null;
}

// engine.ts owns the actual gameplay formula - sumModifier() only knows how
// to sum contributions tagged with a given StatId, it has no opinion about
// what "damage" means or that level exists. A future equipment/talent
// source just becomes a third contributor into the same sumModifier('damage'),
// nothing here changes.
export function calculateDamage(): number {
  return getLevel() + sumModifier('damage');
}

// Trivial/Easy/Even/Deadly, WoW-con-color style. Cross-domain by nature
// (player level vs an encounter's own level) so it lives here, not in
// xp.svelte or encounter.svelte - one place computing it instead of the UI
// (color) and a future outlevel xp penalty each growing their own copy of
// the same bucketing and drifting apart. Takes the level as a plain number
// rather than reading getEncounter() itself, since callers (e.g.
// EncounterCardShell) already receive it via props.
export type LevelGap = 'trivial' | 'easy' | 'even' | 'deadly';

export function getLevelGap(encounterLevel: number): LevelGap {
  const gap = encounterLevel - getLevel();
  if (gap <= -3) return 'trivial';
  if (gap < 0) return 'easy';
  if (gap <= 1) return 'even';
  return 'deadly';
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
  // Social never reaches here - currentHandler() returns null for it, so
  // nothing ever calls applyHit() while it's current. Narrows the rest of
  // this function to the hp-drain kinds.
  if (encounter.action === 'social') return;
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

// Runs alongside currentHandler()'s tick, never through it - the pet has its
// own state slice precisely so it keeps swinging while the player is
// mid-swing, investigating, or idle (see state/pet.svelte.ts). Same
// attacking (grows) -> recovering (drains) -> idle shape as
// attackHandler/AttackMeter, just automatic instead of press-driven.
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
    spawnFloatingText(`-${PET.damage}`, 'damage');
    damageMonster(PET.damage);
    if (encounter.hp <= 0) resolveKill(encounter);
    return;
  }

  if (now - (pet.startedAt ?? 0) >= PET.recoveryMs) setPetIdle();
}

export function tick() {
  if (currentHandler()?.tick()) applyHit();
  petTick();

  const encounter = getEncounter();
  const now = Date.now();

  if (encounter.status === 'dead' && encounter.diedAt !== null && now - encounter.diedAt >= ENCOUNTER_END_MS) {
    // Reset the shared mutex before the next encounter's kind takes over -
    // otherwise a stale cooldown/active status can bleed across the
    // respawn boundary into a differently-kinded encounter.
    setActionIdle();
    // Drop the encounter that just finished. If something was paused
    // behind it (e.g. the fight a genie interrupted), that's the new front
    // for free, revealed exactly as it was left - no decision needed, it
    // was already decided/live. Only decide something fresh if nothing's
    // left at all.
    dropEncounter();
    if (!hasEncounter()) {
      const next = decideNextEncounter(encounter.id as EncounterId);
      journal.encounterSpawned(next.id);
      interruptEncounter(next);
    }
  }
}

// Priority: an active spawn-freeze forces an exact replay of the encounter
// that just died; otherwise an eligible event takes over; otherwise the
// normal weighted zone pick. Only consulted when nothing's left at all -
// see tick() above - so a paused encounter (e.g. what a genie interrupted)
// always resumes rather than a live freeze re-triggering over it. diedId is
// passed explicitly
// rather than read via getEncounter() because the dying encounter has
// already been dropped from the queue by the time this runs.
function decideNextEncounter(diedId: EncounterId): Encounter {
  if (isEffectActive('freezeSpawn')) {
    // Same id always resolves to the same authored level/stats now (no more
    // zone-driven level roll to replay), so this is trivially a repeat.
    return createEncounter(diedId);
  }
  const eventEncounterId = shouldShowEvent();
  if (eventEncounterId) return createEncounter(eventEncounterId);
  const zoneId = getCurrentZoneId();
  return createEncounter(pickEncounter(zoneId));
}

export function useItem(itemId: ItemId) {
  const action = (ITEMS[itemId] as ItemDef).action;
  if (!action) return;
  // Fires before triggerEffect() - immediate feedback that the click
  // registered at all, independent of what the effect actually does (a
  // launchEncounter interrupt is already its own obvious payoff, but
  // grantXp/grantItem/grantModifier have no inherent visual beat of their
  // own without this).
  playSound('ItemUsed');
  // effect.svelte.ts's launchEncounter case calls interruptEncounter()
  // directly rather than routing back through engine.ts, so this is the
  // only place that can notice a launched encounter to log it - comparing
  // instanceId (bumped on every createEncounter(), including a repeat of
  // the same id) is how it's detected rather than an explicit return value.
  const before = getEncounter().instanceId;
  triggerEffect(action.effect);
  if (action.consumes) removeItem(itemId, 1);
  const after = getEncounter();
  if (after.instanceId !== before) journal.encounterSpawned(after.id);
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
// resolveDialogChoice() below, since "loot + xp" doesn't fit what a
// conversation grants (that's what a node's own `effect` is for).
function resolveKill(encounter: Monster | Investigation) {
  awardXp(encounter.xpReward);
  awardLoot(encounter.dropTableId);
  markEventFired(encounter.id);
  journal.encounterCompleted(encounter.id);
  killMonster();
  if (!isEffectActive('freezeSpawn')) advance();
}

// <SocialCard/> calls this instead of reading node.choices directly, so a
// gated choice is genuinely absent (no index, no keybind) rather than
// rendered disabled. evaluateCondition lives in ./condition, not here - it's
// a pure cross-domain read (no writes), shared with journal.ts's entry
// gating so both read off one evaluator instead of growing their own copy.
export function getVisibleDialogChoices(node: DialogNode): readonly DialogChoice[] {
  if (!node.choices) return [];
  return node.choices.filter((choice) => !choice.when || evaluateCondition(choice.when));
}

// Triggered by <SocialCard/>'s choice buttons, not applyHit() - Social never
// enters that path (see currentHandler()). Picking a choice always moves
// currentNode and fires that node's effect (if any) immediately, so it
// lands as soon as the node is reached. Reaching a terminal node (no
// choices of its own) does NOT resolve the encounter here - unlike a kill's
// ENCOUNTER_END_MS flash (tuned for a floating "-N" and an already-empty hp
// bar), a dialog's last line is real prose the player still needs to read.
// See dismissDialog() below for the actual resolution.
export function resolveDialogChoice(next: DialogNodeId) {
  const encounter = getEncounter();
  if (encounter.action !== 'social' || encounter.status !== 'active') return;
  pickDialogChoice(next);
  const node = getDialogNode(next);
  if (node.effect) triggerEffect(node.effect);
  // Logged/flagged before pickDialogChoice's effects can compound - a
  // variant or gate reading this same flag still sees "not yet granted" for
  // this event, not the one after it. FLAG_TRIGGERS (see journal.ts) maps
  // both terminal "a wish got granted" nodes (an item here, or the
  // squirrel's own wish via genie:granted) to the same flag - one wish
  // total, whichever route grants it, not just the item path; otherwise
  // picking the squirrel-nod route first would never flip it and the
  // genie's guardFlag (see effects.ts's summonGenie) would let it be
  // summoned again.
  journal.dialogNode(next);
}

// Triggered by <SocialCard/>'s "Continue" button once the current node is
// terminal - the explicit click resolveDialogChoice() used to do
// automatically the instant a no-choices node was reached. No
// journal.encounterCompleted(encounter.id) here unlike resolveKill() - a kill has one
// clear noteworthy beat (the death), but a conversation's ending is already
// narrated by whichever node it stopped on (each already logged its own
// entry, if any, via resolveDialogChoice). Logging the bare encounter id
// again here would just double up whatever its start already wrote.
export function dismissDialog() {
  const encounter = getEncounter();
  if (encounter.action !== 'social' || encounter.status !== 'active') return;
  const node = getDialogNode(encounter.currentNode);
  if (node.choices && node.choices.length > 0) return;
  markEventFired(encounter.id);
  killMonster();
  if (!isEffectActive('freezeSpawn')) advance();
}
