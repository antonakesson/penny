import { ACTION, ENCOUNTER_END_MS, INVESTIGATE } from './config';
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
import { DIALOGS, type DialogNodeId } from './data/dialog';
import { advance } from './state/map.svelte';
import { pickEncounter } from './data/zones';
import { getCurrentZoneId } from './state/zone.svelte';
import { shouldShowEvent, markEventFired } from './state/events.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { addXp, getLevel } from './state/xp.svelte';
import { addItem, removeItem, getInventory } from './state/inventory.svelte';
import { discoverMonster } from './state/bestiary.svelte';
import { getBestiaryEntry } from './data/bestiary';
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
    // Drop the encounter that just finished. If something was paused
    // behind it (e.g. the fight a genie interrupted), that's the new front
    // for free, revealed exactly as it was left - no decision needed, it
    // was already decided/live. Only decide something fresh if nothing's
    // left at all.
    dropEncounter();
    if (!hasEncounter()) interruptEncounter(decideNextEncounter(encounter.id as EncounterId));
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
  triggerEffect(action.effect);
  if (action.consumes) removeItem(itemId, 1);
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
  }
}

// Only the hp-drain kinds resolve through here - Social gets its own
// resolveDialogChoice() below, since "loot + xp" doesn't fit what a
// conversation grants (that's what a node's own `effect` is for).
function resolveKill(encounter: Monster | Investigation) {
  awardXp(encounter.xpReward);
  awardLoot(encounter.dropTableId);
  markEventFired(encounter.id);
  killMonster();
  if (!isEffectActive('freezeSpawn')) advance();
}

// Triggered by <SocialCard/>'s choice buttons, not applyHit() - Social never
// enters that path (see currentHandler()). Picking a choice always moves
// currentNode; only a terminal node (no choices of its own) resolves the
// encounter, firing its effect (if any) first so it lands before the
// encounter disappears.
export function resolveDialogChoice(next: DialogNodeId) {
  const encounter = getEncounter();
  if (encounter.action !== 'social' || encounter.status !== 'active') return;
  pickDialogChoice(next);
  const node = DIALOGS[next];
  if (node.effect) triggerEffect(node.effect);
  if (!node.choices || node.choices.length === 0) {
    markEventFired(encounter.id);
    killMonster();
    if (!isEffectActive('freezeSpawn')) advance();
  }
}
