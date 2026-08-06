import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState, getLevelProgress as getLevelProgressState } from './state/xp.svelte';
import { getPet as getPetState } from './state/pet.svelte';
import { getEncounter as getEncounterState } from './state/encounter.svelte';
import { getFloatingTexts as getFloatingTextsState } from './state/floatingText.svelte';
import { getXpFloatingTexts as getXpFloatingTextsState } from './state/xpFloatingText.svelte';
import { getActiveEffects as getActiveEffectsState } from './state/effect.svelte';
import { getEntries as getJournalEntriesState } from './state/journal.svelte';
import { getAllFlags as getAllFlagsState } from './state/journalFlags.svelte';
import { sumModifier as sumModifierState } from './state/modifier.svelte';
import type { StatId } from './data/modifiers';
import { getCurrentZoneId } from './state/zone.svelte';
import {
  getSeed as getSeedState,
  getDistance as getDistanceState,
  getSignalAt as getSignalAtState,
  getDifficultyAt as getDifficultyAtState,
  isReturning as isReturningState,
} from './state/map.svelte';
import {
  isFeatureUnlocked as isFeatureUnlockedState,
  getPendingAnnouncement as getPendingAnnouncementState,
  dismissAnnouncement as dismissAnnouncementState,
} from './state/features.svelte';
import { FEATURES, type FeatureId } from './data/features';
import { isSoundEnabled as isSoundEnabledState, setSoundEnabled as setSoundEnabledState } from './state/settings.svelte';
import type { ItemId } from './data/loot';
import { isSkillKnown as isSkillKnownState, getKnownSkillIds as getKnownSkillIdsState } from './state/skill.svelte';
import {
  getCooldownEndsAt as getSkillCooldownEndsAtState,
  getExclusiveSkill as getExclusiveSkillState,
  getActiveSkill as getActiveSkillState,
} from './state/skillActivation.svelte';
import { channelDps, type SkillId } from './data/skills';
import {
  tick as tickInternal,
  useItem as useItemInternal,
  pressSkill as pressSkillInternal,
  releaseSkill as releaseSkillInternal,
  press as pressInternal,
  release as releaseInternal,
  learnSkill as learnSkillInternal,
  getLevelGap as getLevelGapInternal,
} from './engine';
export type { LevelGap } from './engine';
import { calculateDamage as calculateDamageInternal } from './damage';
import {
  resolveDialogChoice as resolveDialogChoiceInternal,
  dismissDialog as dismissDialogInternal,
  getVisibleDialogChoices as getVisibleDialogChoicesInternal,
  getDialogSayLines as getDialogSayLinesInternal,
} from './dialogEngine';
import type { DialogNode, DialogChoice } from './data/dialog';
import {
  resolveCrossroadChoice as resolveCrossroadChoiceInternal,
  getVisibleCrossroadBranches as getVisibleCrossroadBranchesInternal,
} from './crossroadEngine';
import type { CrossroadBranch } from './data/encounters';
import type { ZoneId } from './data/zones';
import {
  loadSave,
  saveNow as saveNowInternal,
  exportSave as exportSaveInternal,
  importSave as importSaveInternal,
  resetSave as resetSaveInternal,
} from './save';
import { getCurrentSubZoneView } from './map';
import type { EncounterId } from './data/encounters';
import type { EffectId } from './data/effects';
import {
  devSpawn,
  devAddItem,
  devAwardXp,
  devSetDistance,
  devSetSeed,
  devSetZone,
  devTriggerEffect,
  devLearnSkill,
  devDumpState,
} from './devtools';

export function getInventory() {
  return getInventoryState();
}

export function getXp() {
  return getXpState();
}

export function getLevelProgress() {
  return getLevelProgressState();
}

// Whatever the player is currently doing to the encounter in front of them -
// a cast winding up, a channel running, a swing recovering - or null. The
// attack/investigate meters draw off this.
export function getExclusiveSkill() {
  return getExclusiveSkillState();
}

export function getPet() {
  return getPetState();
}

export function getEncounter() {
  return getEncounterState();
}

export function getFloatingTexts() {
  return getFloatingTextsState();
}

export function getXpFloatingTexts() {
  return getXpFloatingTextsState();
}

export function getActiveEffects() {
  return getActiveEffectsState();
}

export function getJournalEntries() {
  return getJournalEntriesState();
}

export function getFlags() {
  return getAllFlagsState();
}

export function sumModifier(stat: StatId) {
  return sumModifierState(stat);
}

export function getZone() {
  return getCurrentSubZoneView(getCurrentZoneId(), getDistanceState());
}

export function getSeed() {
  return getSeedState();
}

export function getDistance() {
  return getDistanceState();
}

export function getSignalAt(distance: number) {
  return getSignalAtState(distance);
}

export function getDifficultyAt(distance: number) {
  return getDifficultyAtState(distance);
}

// Read-only from here on - direction now only flips through useSkill()'s
// toggleDirection effect (see Skills.svelte's Turn Around row). Nothing
// left calls a UI-level setReturning() directly; map.svelte.ts's own
// setReturning is still there for effect.svelte.ts and devtools.ts to call.
export function isReturning() {
  return isReturningState();
}

export function isFeatureUnlocked(id: FeatureId) {
  return isFeatureUnlockedState(id);
}

export function getPendingFeatureAnnouncement() {
  const id = getPendingAnnouncementState();
  return id ? { id, ...FEATURES[id] } : null;
}

export function dismissFeatureAnnouncement() {
  dismissAnnouncementState();
}

export function press() {
  pressInternal();
}

export function release() {
  releaseInternal();
}

export function getDamage() {
  return calculateDamageInternal();
}

export function getLevelGap(encounterLevel: number) {
  return getLevelGapInternal(encounterLevel);
}

export function useItem(itemId: ItemId) {
  useItemInternal(itemId);
}

export function pressSkill(skillId: SkillId) {
  pressSkillInternal(skillId);
}

export function releaseSkill(skillId: SkillId) {
  releaseSkillInternal(skillId);
}

export function learnSkill(skillId: SkillId) {
  learnSkillInternal(skillId);
}

export function isSkillKnown(id: SkillId) {
  return isSkillKnownState(id);
}

// Pure snapshot (see skillActivation.svelte.ts) - the Skills pane compares
// this against its own polled clock so the row's dim-while-cooling-down
// state re-renders as time passes without this getter needing to be called
// every frame.
export function getSkillCooldownEndsAt(id: SkillId) {
  return getSkillCooldownEndsAtState(id);
}

export function getActiveSkill(id: SkillId) {
  return getActiveSkillState(id);
}

// How fast a channel skill drains its target - InvestigationCard's
// "seconds left" readout is the only caller.
export function getChannelDps(id: SkillId) {
  return channelDps(id);
}

export function getKnownSkillIds() {
  return getKnownSkillIdsState();
}

export function resolveDialogChoice(choice: DialogChoice) {
  resolveDialogChoiceInternal(choice);
}

export function dismissDialog() {
  dismissDialogInternal();
}

export function getVisibleDialogChoices(node: DialogNode) {
  return getVisibleDialogChoicesInternal(node);
}

export function getDialogSayLines(node: DialogNode) {
  return getDialogSayLinesInternal(node);
}

export function resolveCrossroadChoice(choice: CrossroadBranch | 'continue') {
  resolveCrossroadChoiceInternal(choice);
}

export function getVisibleCrossroadBranches(branches: readonly CrossroadBranch[]) {
  return getVisibleCrossroadBranchesInternal(branches);
}

export function tick() {
  tickInternal();
}

// Loads any existing save. Called once at startup, before the tick loop
// starts.
export function initGame() {
  loadSave();
}

export function saveNow() {
  saveNowInternal();
}

export function exportSave() {
  return exportSaveInternal();
}

export function importSave(encoded: string) {
  return importSaveInternal(encoded);
}

export function resetSave() {
  resetSaveInternal();
}

export function isSoundEnabled() {
  return isSoundEnabledState();
}

export function setSoundEnabled(value: boolean) {
  setSoundEnabledState(value);
}

// Dev-only passthroughs - DevTools.svelte is the only caller, and it's
// itself gated by import.meta.env.DEV at its usage site.
export function devToolsSpawn(id: EncounterId) {
  devSpawn(id);
}

export function devToolsAddItem(id: ItemId, qty: number) {
  devAddItem(id, qty);
}

export function devToolsAwardXp(amount: number) {
  devAwardXp(amount);
}

export function devToolsSetDistance(distance: number) {
  devSetDistance(distance);
}

export function devToolsSetSeed(seed: string) {
  devSetSeed(seed);
}

export function devToolsSetZone(id: ZoneId) {
  devSetZone(id);
}

export function devToolsTriggerEffect(effectId: EffectId) {
  devTriggerEffect(effectId);
}

export function devToolsLearnSkill(skillId: SkillId) {
  devLearnSkill(skillId);
}

export function devToolsDumpState() {
  return devDumpState();
}
