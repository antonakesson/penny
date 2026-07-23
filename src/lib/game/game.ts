import { getMonster as getMonsterState } from './state/monster.svelte';
import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState } from './state/xp.svelte';
import { getAction as getActionState } from './state/action.svelte';
import { getFloatingTexts as getFloatingTextsState } from './state/floatingText.svelte';
import { getCurrentZoneId } from './state/zone.svelte';
import { getWelcomeBack as getWelcomeBackState, clearWelcomeBack as clearWelcomeBackInternal } from './state/notice.svelte';
import { startAction as startActionInternal, tick as tickInternal } from './engine';
import { loadSave, saveNow as saveNowInternal, exportSave as exportSaveInternal, importSave as importSaveInternal } from './save';
import { ZONES } from './data/zones';

export function getMonster() {
  return getMonsterState();
}

export function getInventory() {
  return getInventoryState();
}

export function getXp() {
  return getXpState();
}

export function getAction() {
  return getActionState();
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

export function getWelcomeBack() {
  return getWelcomeBackState();
}

export function clearWelcomeBack() {
  clearWelcomeBackInternal();
}

// Loads any existing save and fast-forwards offline progress. Called once
// at startup, before the tick loop starts.
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
