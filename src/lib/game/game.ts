import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState, getLevelProgress as getLevelProgressState } from './state/xp.svelte';
import { getAction as getActionState } from './state/action.svelte';
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
} from './state/map.svelte';
import {
  isFeatureUnlocked as isFeatureUnlockedState,
  getPendingAnnouncement as getPendingAnnouncementState,
  dismissAnnouncement as dismissAnnouncementState,
} from './state/features.svelte';
import { FEATURES, type FeatureId } from './data/features';
import { isSoundEnabled as isSoundEnabledState, setSoundEnabled as setSoundEnabledState } from './state/settings.svelte';
import type { ItemId } from './data/loot';
import {
  press as pressInternal,
  release as releaseInternal,
  tick as tickInternal,
  useItem as useItemInternal,
  calculateDamage as calculateDamageInternal,
  resolveDialogChoice as resolveDialogChoiceInternal,
  dismissDialog as dismissDialogInternal,
  getLevelGap as getLevelGapInternal,
  getVisibleDialogChoices as getVisibleDialogChoicesInternal,
} from './engine';
export type { LevelGap } from './engine';
import type { DialogNodeId, DialogNode } from './data/dialog';
import {
  loadSave,
  saveNow as saveNowInternal,
  exportSave as exportSaveInternal,
  importSave as importSaveInternal,
  resetSave as resetSaveInternal,
} from './save';
import { ZONES } from './data/zones';
import type { EncounterId } from './data/encounters';
import type { EffectId } from './data/effects';
import {
  devSpawn,
  devAddItem,
  devAwardXp,
  devSetDistance,
  devSetSeed,
  devTriggerEffect,
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

export function getAction() {
  return getActionState();
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
  return ZONES[getCurrentZoneId()];
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

export function resolveDialogChoice(next: DialogNodeId) {
  resolveDialogChoiceInternal(next);
}

export function dismissDialog() {
  dismissDialogInternal();
}

export function getVisibleDialogChoices(node: DialogNode) {
  return getVisibleDialogChoicesInternal(node);
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

export function devToolsTriggerEffect(effectId: EffectId) {
  devTriggerEffect(effectId);
}

export function devToolsDumpState() {
  return devDumpState();
}
