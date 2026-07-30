import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState, getLevelProgress as getLevelProgressState } from './state/xp.svelte';
import { getAction as getActionState } from './state/action.svelte';
import { getEncounter as getEncounterState } from './state/encounter.svelte';
import { isDiscovered as isDiscoveredState, getMaxDiscoveredEntryNo as getMaxDiscoveredEntryNoState } from './state/bestiary.svelte';
import { getFloatingTexts as getFloatingTextsState } from './state/floatingText.svelte';
import { getXpFloatingTexts as getXpFloatingTextsState } from './state/xpFloatingText.svelte';
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
  resolveRabbidSquirrelPick as resolveRabbidSquirrelPickInternal,
} from './engine';
import {
  loadSave,
  saveNow as saveNowInternal,
  exportSave as exportSaveInternal,
  importSave as importSaveInternal,
  resetSave as resetSaveInternal,
} from './save';
import { ZONES } from './data/zones';
import type { EncounterId } from './data/encounters';
import {
  devSpawn,
  devAddItem,
  devAwardXp,
  devSetDistance,
  devSetSeed,
  devStartSpawnFreeze,
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

export function getEncounter() {
  return getEncounterState();
}

export function isMonsterDiscovered(entryNo: number) {
  return isDiscoveredState(entryNo);
}

export function getMaxDiscoveredEntryNo() {
  return getMaxDiscoveredEntryNoState();
}

export function getFloatingTexts() {
  return getFloatingTextsState();
}

export function getXpFloatingTexts() {
  return getXpFloatingTextsState();
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

// Combines encounter state (is this the monster's first-ever encounter)
// with feature-unlock state (has the player unlocked the Bestiary yet) -
// the discovery reveal must never show ahead of the unlock itself.
export function isDiscoveryVisible(isNewDiscovery: boolean) {
  return isNewDiscovery && isFeatureUnlockedState('bestiary');
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

export function useItem(itemId: ItemId) {
  useItemInternal(itemId);
}

export function resolveRabbidSquirrelPick() {
  resolveRabbidSquirrelPickInternal();
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

export function devToolsStartSpawnFreeze(kills: number) {
  devStartSpawnFreeze(kills);
}

export function devToolsDumpState() {
  return devDumpState();
}
