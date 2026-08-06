import { ENCOUNTER_END_MS } from './config';
import {
  getEncounter,
  createEncounter,
  interruptEncounter,
  dropEncounter,
  hasEncounter,
} from './state/encounter.svelte';
import { pickEncounter, resolvePoiAt } from './map';
import { getCurrentZoneId } from './state/zone.svelte';
import { getDistance, getNumericSeed } from './state/map.svelte';
import { getLevel } from './state/xp.svelte';
import { removeItem } from './state/inventory.svelte';
import { ITEMS, type ItemId, type ItemDef } from './data/loot';
import { SKILLS, getSkillEffects, type SkillId } from './data/skills';
import { SKILL_GRANTS } from './data/skillGrants';
import { isSkillKnown, learnSkill as learnSkillState } from './state/skill.svelte';
import {
  getExclusiveSkill,
  getFreeSkill,
  getActiveSkill,
  isSlotBusy,
  startSkill,
  setSkillPhase,
  advanceChannelTick,
  clearSkill,
  clearExclusiveSkill,
  setCooldown,
  getCooldownEndsAt,
} from './state/skillActivation.svelte';
import { triggerEffect, isEffectActive } from './state/effect.svelte';
import { playSound } from './audio';
import { runPetTick, resolveEncounterDeath } from './combatEngine';
import type { Encounter, ActionKind } from './types';
import type { EncounterId } from './data/encounters';
import { assertNever } from './util/assertNever';
import * as journal from './journal';

// Trivial/Easy/Even/Deadly, WoW-con-color style.
export type LevelGap = 'trivial' | 'easy' | 'even' | 'deadly';

export function getLevelGap(encounterLevel: number): LevelGap {
  const gap = encounterLevel - getLevel();
  if (gap <= -3) return 'trivial';
  if (gap < 0) return 'easy';
  if (gap <= 1) return 'even';
  return 'deadly';
}

// Ordering matters and is the whole reason this is explicit rather than an
// event bus: skills and the pet both deal damage, so death is resolved once
// after both have had their turn instead of at every damage site. What a
// kill MEANS (loot/xp/journal) is combatEngine.ts's resolveEncounterDeath();
// what happens to the queue afterwards is this function's own business.
export function tick() {
  resolveSkills();
  runPetTick();
  resolveEncounterDeath();

  const encounter = getEncounter();
  const now = Date.now();

  if (encounter.status === 'dead' && encounter.diedAt !== null && now - encounter.diedAt >= ENCOUNTER_END_MS) {
    // Drop any half-finished swing before the next encounter's skill takes
    // over the slot.
    clearExclusiveSkill();
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
// otherwise a POI anchored at the current distance; otherwise the normal
// zone pick. diedId is passed explicitly since the dying encounter is
// already dropped from the queue by the time this runs.
function decideNextEncounter(diedId: EncounterId): Encounter {
  if (isEffectActive('freezeSpawn')) return createEncounter(diedId);
  const zoneId = getCurrentZoneId();
  const poiEncounterId = resolvePoiAt(zoneId, getDistance(), getNumericSeed());
  if (poiEncounterId) return createEncounter(poiEncounterId);
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
  // action.effect may be a single id or a list fired in order off the one
  // click (see ItemDef.action in loot.ts) - corkedBottle uses this to both
  // launch the genie and swap itself inert in the same beat.
  const effects = Array.isArray(action.effect) ? action.effect : [action.effect];
  for (const effect of effects) triggerEffect(effect);
  if (action.consumes) removeItem(itemId, 1);
  const after = getEncounter();
  if (after.instanceId !== before) journal.encounterSpawned(after.id);
}

// The current encounter's own combat skill, if it has one - an encounter's
// `action` field IS a SkillId for the hp-drain kinds (see SkillDef.exclusive
// in data/skills.ts). null for social/crossroad, which resolve by clicking a
// choice and never touch the activation slot at all.
function currentActionSkill(): SkillId | null {
  const encounter = getEncounter();
  if (encounter.action === 'social' || encounter.action === 'crossroad') return null;
  return encounter.action satisfies ActionKind;
}

// An exclusive skill is only usable against an encounter that names it, and
// only while that encounter is still alive - the hp check is what stops a
// channel from landing one more tick on something that died earlier this
// same tick. A non-exclusive skill has no target and is always usable.
function isUsable(skillId: SkillId): boolean {
  if (!SKILLS[skillId].exclusive) return true;
  const encounter = getEncounter();
  return currentActionSkill() === skillId && encounter.status === 'active' && 'hp' in encounter && encounter.hp > 0;
}

// Press/release rather than a single use() - a channel needs to know when
// you let go, and a cast deliberately doesn't care (a swing commits once
// started). Guarded on isSkillKnown() defensively: the Skills pane shouldn't
// render a clickable row for a skill that isn't known, but this is the one
// place it would actually matter if it somehow did.
export function pressSkill(skillId: SkillId) {
  if (!isSkillKnown(skillId)) return;
  if (isSlotBusy(skillId)) return;
  if (!isUsable(skillId)) return;
  const now = Date.now();
  const endsAt = getCooldownEndsAt(skillId);
  if (endsAt !== undefined && now < endsAt) return;

  const { timing } = SKILLS[skillId];
  switch (timing.kind) {
    case 'instant':
      fireSkill(skillId, now);
      return;
    case 'cast':
      startSkill(skillId, 'casting', now);
      return;
    // No tick on press - the first one lands a full tickMs in, so a tap
    // that's released immediately does nothing, same as the old
    // hold-to-search did.
    case 'channel':
      startSkill(skillId, 'channeling', now);
      return;
    default:
      return assertNever(timing);
  }
}

export function releaseSkill(skillId: SkillId) {
  const active = getActiveSkill(skillId);
  if (active?.phase !== 'channeling') return;
  endActivation(skillId, Date.now());
}

// The pointer surface (see App.svelte) presses whatever the encounter in
// front is fought with, without knowing which skill that is. No-ops on
// social/crossroad, which is what lets the same handler fire alongside
// dismissDialog() safely.
export function press() {
  const skillId = currentActionSkill();
  if (skillId) pressSkill(skillId);
}

export function release() {
  const skillId = currentActionSkill();
  if (skillId) releaseSkill(skillId);
}

// Fires the effects and starts the cooldown. Every timing shape funnels
// through here, so a cast, a channel tick and an instant skill all cool down
// by the same rule.
function fireSkill(skillId: SkillId, now: number) {
  for (const effect of getSkillEffects(skillId)) triggerEffect(effect);
  const { cooldownMs } = SKILLS[skillId];
  if (cooldownMs > 0) setCooldown(skillId, now + cooldownMs);
}

// Cooldown is served in the slot rather than out of it, so the meter has a
// phase to draw and the skill can't be re-pressed until it's done. A skill
// with no cooldown frees the slot immediately.
function endActivation(skillId: SkillId, now: number) {
  if (SKILLS[skillId].cooldownMs > 0) setSkillPhase(skillId, 'recovering', now);
  else clearSkill(skillId);
}

// One state machine for all three timing shapes, replacing the per-kind
// handlers combatEngine.ts used to carry. Runs both slots; each is a no-op
// when empty.
function resolveSkills() {
  const now = Date.now();
  resolveActivation(getExclusiveSkill()?.id, now);
  resolveActivation(getFreeSkill()?.id, now);
}

function resolveActivation(skillId: SkillId | undefined, now: number) {
  if (!skillId) return;
  const active = getActiveSkill(skillId);
  if (!active) return;

  // Whatever the phase, an activation that's lost its target is over -
  // covers a dead encounter, an interrupting one cutting in front, and a
  // channel whose target ran out of hp mid-hold.
  if (!isUsable(skillId)) {
    clearSkill(skillId);
    return;
  }

  const { timing } = SKILLS[skillId];
  if (active.phase === 'recovering') {
    const endsAt = getCooldownEndsAt(skillId);
    if (endsAt === undefined || now >= endsAt) clearSkill(skillId);
    return;
  }
  if (active.phase === 'casting' && timing.kind === 'cast') {
    if (now - active.startedAt < timing.castTimeMs) return;
    fireSkill(skillId, now);
    endActivation(skillId, now);
    return;
  }
  if (active.phase === 'channeling' && timing.kind === 'channel' && timing.tickMs > 0) {
    // while, not if - advancing lastTickAt by exactly tickMs means a slow
    // frame pays back every tick it owes instead of dropping the remainder.
    while (now - active.lastTickAt >= timing.tickMs) {
      advanceChannelTick(skillId, timing.tickMs);
      fireSkill(skillId, now);
      if (!isUsable(skillId)) {
        clearSkill(skillId);
        return;
      }
    }
  }
}

// The Skill Trainer pane already grays out and disables a row below its
// grant level, so this guard is defensive rather than load-bearing - same
// relationship useItem() has to its own UI. No feedback effect/sound on
// success (unlike useItem's playSound) - learning is a state flip the pane
// itself reflects immediately, not an event that needs its own beat.
export function learnSkill(skillId: SkillId) {
  if (isSkillKnown(skillId)) return;
  if (getLevel() < SKILL_GRANTS[skillId]) return;
  learnSkillState(skillId);
}

// Dialog resolution (resolveDialogChoice/dismissDialog/getVisibleDialogChoices/
// getDialogSayLines) lives in dialogEngine.ts - same composition-layer role
// as this file, split out because it's a fully self-contained cluster that
// shares no logic with the encounter-lifecycle/item code here. Re-exported
// through game.ts alongside everything else, so the "one seam" rule holds.
