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
  setCharacterName,
} from './state/encounter.svelte';
import { getDialogNode, type DialogNodeId, type DialogNode, type DialogChoice } from './data/dialog';
import { CHARACTERS } from './data/characters';
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
// function directly instead of going through press()/release()/tick().
function currentHandler(): ActionHandler | null {
  const action = getEncounter().action;
  if (action === 'attack') return attackHandler;
  if (action === 'investigate') return investigateHandler;
  return null;
}

export function calculateDamage(): number {
  return getLevel() + sumModifier('damage');
}

// Trivial/Easy/Even/Deadly, WoW-con-color style.
export type LevelGap = 'trivial' | 'easy' | 'even' | 'deadly';

export function getLevelGap(encounterLevel: number): LevelGap {
  const gap = encounterLevel - getLevel();
  if (gap <= -3) return 'trivial';
  if (gap < 0) return 'easy';
  if (gap <= 1) return 'even';
  return 'deadly';
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
    // Reset the shared mutex before the next encounter's kind takes over.
    setActionIdle();
    // Anything paused behind the dropped encounter becomes the new front
    // automatically. Only decide something fresh if nothing's left.
    dropEncounter();
    if (!hasEncounter()) {
      const next = decideNextEncounter(encounter.id as EncounterId);
      journal.encounterSpawned(next.id);
      interruptEncounter(next);
    }
  }
}

// Priority: an active spawn-freeze replays the encounter that just died;
// otherwise an eligible event; otherwise the normal zone pick. diedId is
// passed explicitly since the dying encounter is already dropped from the
// queue by the time this runs.
function decideNextEncounter(diedId: EncounterId): Encounter {
  if (isEffectActive('freezeSpawn')) return createEncounter(diedId);
  const eventEncounterId = shouldShowEvent();
  if (eventEncounterId) return createEncounter(eventEncounterId);
  const zoneId = getCurrentZoneId();
  return createEncounter(pickEncounter(zoneId));
}

export function useItem(itemId: ItemId) {
  const action = (ITEMS[itemId] as ItemDef).action;
  if (!action) return;
  // Fires before triggerEffect() - immediate feedback the click registered,
  // independent of what the effect does.
  playSound('ItemUsed');
  // effect.svelte.ts's launchEncounter case interrupts directly, so
  // comparing instanceId before/after is how a launched encounter is
  // detected here to log it.
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
// resolveDialogChoice()/dismissDialog() below.
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
// rendered disabled.
export function getVisibleDialogChoices(node: DialogNode): readonly DialogChoice[] {
  if (!node.choices) return [];
  return node.choices.filter((choice) => !choice.when || evaluateCondition(choice.when));
}

// <SocialCard/> calls this instead of reading node.lines directly - it
// resolves each 'say' line's speaker to a display name (CHARACTERS' default,
// overridden by any 'rename' line already processed for this encounter) and
// drops 'action'/'rename' lines, which are silent. Renames are applied once
// on node arrival (see resolveDialogChoice() below), so a node that both
// renames a character and has that character speak always renders with the
// post-rename name - there's no line-by-line temporal cursor since all of a
// node's lines display at once.
export function getDialogSayLines(node: DialogNode): { speaker: string; text: string }[] {
  const encounter = getEncounter();
  const overrides = encounter.action === 'social' ? encounter.nameOverrides : {};
  return node.lines
    .filter((line) => line.kind === 'say')
    .map((line) => ({
      speaker: line.speaker === 'narrator' ? 'Narrator' : (overrides[line.speaker] ?? CHARACTERS[line.speaker]),
      text: line.text,
    }));
}

// Reaching a terminal node (no choices of its own) does NOT resolve the
// encounter here - a dialog's last line is real prose the player still
// needs to read. See dismissDialog() below for the actual resolution.
export function resolveDialogChoice(next: DialogNodeId) {
  const encounter = getEncounter();
  if (encounter.action !== 'social' || encounter.status !== 'active') return;
  pickDialogChoice(next);
  const node = getDialogNode(next);
  for (const line of node.lines) {
    if (line.kind === 'action') triggerEffect(line.effect);
    else if (line.kind === 'rename') setCharacterName(line.character, line.name);
  }
  journal.dialogNode(next);
}

// No journal.encounterCompleted() here unlike resolveKill() - a
// conversation's ending is already narrated by whichever node it stopped
// on, each already logged via resolveDialogChoice.
export function dismissDialog() {
  const encounter = getEncounter();
  if (encounter.action !== 'social' || encounter.status !== 'active') return;
  const node = getDialogNode(encounter.currentNode);
  if (node.choices && node.choices.length > 0) return;
  markEventFired(encounter.id);
  killMonster();
  if (!isEffectActive('freezeSpawn')) advance();
}
