import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState } from './state/xp.svelte';
import { getAction as getActionState } from './state/action.svelte';
import { getEncounter as getEncounterState } from './state/encounter.svelte';
import { isDiscovered as isDiscoveredState, getMaxDiscoveredEntryNo as getMaxDiscoveredEntryNoState } from './state/bestiary.svelte';
import { getFloatingTexts as getFloatingTextsState } from './state/floatingText.svelte';
import { getCurrentZoneId } from './state/zone.svelte';
import { getSeed as getSeedState, getDistance as getDistanceState } from './state/map.svelte';
import {
  isFeatureUnlocked as isFeatureUnlockedState,
  getPendingAnnouncement as getPendingAnnouncementState,
  dismissAnnouncement as dismissAnnouncementState,
} from './state/features.svelte';
import { FEATURES, type FeatureId } from './data/features';
import type { ItemId } from './data/loot';
import { click as clickInternal, tick as tickInternal, useItem as useItemInternal } from './engine';
import {
  loadSave,
  saveNow as saveNowInternal,
  exportSave as exportSaveInternal,
  importSave as importSaveInternal,
  resetSave as resetSaveInternal,
} from './save';
import { ZONES } from './data/zones';

export function getInventory() {
  return getInventoryState();
}

export function getXp() {
  return getXpState();
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

export function getZone() {
  return ZONES[getCurrentZoneId()];
}

export function getSeed() {
  return getSeedState();
}

export function getDistance() {
  return getDistanceState();
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

export function click() {
  clickInternal();
}

export function useItem(itemId: ItemId) {
  useItemInternal(itemId);
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
