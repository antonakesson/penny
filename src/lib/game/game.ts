import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState } from './state/xp.svelte';
import { getAction as getActionState } from './state/action.svelte';
import { getEncounter as getEncounterState } from './state/encounter.svelte';
import { getMercenaries as getMercenariesState } from './state/mercenary.svelte';
import { getTreasureRuntime as getTreasureRuntimeState, startInvestigating as startInvestigatingInternal } from './state/treasure.svelte';
import {
  getRecruitRuntime as getRecruitRuntimeState,
  startStage as startStageInternal,
  setHolding as setHoldingInternal,
} from './state/recruitEvent.svelte';
import { getFloatingTexts as getFloatingTextsState } from './state/floatingText.svelte';
import { getCurrentZoneId } from './state/zone.svelte';
import { startAction as startActionInternal, tick as tickInternal } from './engine';
import { loadSave, saveNow as saveNowInternal, exportSave as exportSaveInternal, importSave as importSaveInternal } from './save';
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

export function getMercenaries() {
  return getMercenariesState();
}

export function getTreasureRuntime() {
  return getTreasureRuntimeState();
}

export function startInvestigating() {
  startInvestigatingInternal();
}

export function getRecruitRuntime() {
  return getRecruitRuntimeState();
}

export function startStage() {
  startStageInternal();
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

export function startAction() {
  startActionInternal();
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
