import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState } from './state/xp.svelte';
import { getAction as getActionState } from './state/action.svelte';
import { getEncounter as getEncounterState } from './state/encounter.svelte';
import { getPets as getPetsState } from './state/pet.svelte';
import { isDiscovered as isDiscoveredState, getMaxDiscoveredEntryNo as getMaxDiscoveredEntryNoState } from './state/bestiary.svelte';
import { getTreasureRuntime as getTreasureRuntimeState } from './state/treasure.svelte';
import { getRecruitRuntime as getRecruitRuntimeState, setHolding as setHoldingInternal } from './state/recruitEvent.svelte';
import { getFloatingTexts as getFloatingTextsState } from './state/floatingText.svelte';
import { getCurrentZoneId } from './state/zone.svelte';
import { click as clickInternal, tick as tickInternal } from './engine';
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

export function getPets() {
  return getPetsState();
}

export function isMonsterDiscovered(entryNo: number) {
  return isDiscoveredState(entryNo);
}

export function getMaxDiscoveredEntryNo() {
  return getMaxDiscoveredEntryNoState();
}

export function getTreasureRuntime() {
  return getTreasureRuntimeState();
}

export function getRecruitRuntime() {
  return getRecruitRuntimeState();
}

export function setHolding(holding: boolean) {
  setHoldingInternal(holding);
}

export function getFloatingTexts() {
  return getFloatingTextsState();
}

export function getZone() {
  return ZONES[getCurrentZoneId()];
}

export function click() {
  clickInternal();
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
