import { getMonster as getMonsterState } from './state/monster.svelte';
import { getInventory as getInventoryState } from './state/inventory.svelte';
import { getXp as getXpState } from './state/xp.svelte';
import { getAction as getActionState } from './state/action.svelte';
import { getFloatingTexts as getFloatingTextsState } from './state/floatingText.svelte';
import { startAction as startActionInternal, tick as tickInternal } from './engine';
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
  return ZONES.zone1;
}

export function startAction() {
  startActionInternal();
}

export function tick() {
  tickInternal();
}
