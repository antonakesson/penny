import { ACTION, ENCOUNTER_END_MS } from './config';
import { getEncounter, damageMonster, killMonster, spawn } from './state/encounter.svelte';
import { advance } from './state/map.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem, removeItem } from './state/inventory.svelte';
import { discoverMonster } from './state/bestiary.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS, type ItemId, type ItemDef } from './data/loot';
import { ITEM_ACTIONS, type ItemActionId } from './data/itemActions';
import { unlockFeature } from './state/features.svelte';
import { assertNever } from './util/assertNever';

export function startAction() {
  const action = getAction();
  if (action.status !== 'idle') return;
  const monster = getEncounter();
  if (monster.status !== 'active') return;
  setActionActive(Date.now());
}

export function click() {
  startAction();
}

export function tick() {
  const action = getAction();
  if (action.startedAt !== null) {
    const elapsed = Date.now() - action.startedAt;
    if (action.status === 'active') {
      if (elapsed >= ACTION.activeMs) resolveHit();
    } else if (action.status === 'cooldown') {
      if (elapsed >= ACTION.cooldownMs) setActionIdle();
    }
  }

  const monster = getEncounter();
  const now = Date.now();
  // Discovery is logged as soon as the monster is on screen, not on kill —
  // a no-op past the first tick it's seen, since discoverMonster just sets
  // a bit.
  discoverMonster(monster.entryNo);
  if (monster.status === 'dead' && monster.diedAt !== null && now - monster.diedAt >= ENCOUNTER_END_MS) {
    spawn();
  }
}

function awardLoot(dropTableId: readonly string[], xpReward: number) {
  const drops = resolveDropIds(dropTableId);
  awardXp(xpReward);
  for (const dropId of drops) addItem(dropId, 1);
  for (const dropId of drops) spawnLootText(`+1 ${ITEMS[dropId].name}`, ITEMS[dropId].rarity);
}

export function useItem(itemId: ItemId) {
  const actionId = (ITEMS[itemId] as ItemDef).action;
  if (!actionId) return;
  applyItemAction(actionId);
  if (ITEM_ACTIONS[actionId].consumes) removeItem(itemId, 1);
}

function applyItemAction(actionId: ItemActionId) {
  switch (actionId) {
    case 'unlockBestiary':
      unlockFeature('bestiary');
      return;
    default:
      assertNever(actionId);
  }
}

function resolveHit() {
  const monster = getEncounter();
  spawnFloatingText('-1', 'damage');
  damageMonster(1);
  if (monster.hp <= 0) {
    awardLoot(monster.dropTableId, monster.xpReward);
    killMonster();
    advance();
  }
  setActionCooldown(Date.now());
}
