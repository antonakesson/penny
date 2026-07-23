import { ACTION, ENCOUNTER_END_MS } from './config';
import {
  getEncounter,
  damageMonster,
  killMonster,
  tapEvent,
  resolveEvent,
  spawnNextEncounter,
} from './state/encounter.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem } from './state/inventory.svelte';
import { addMercenary } from './state/mercenary.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS, type ItemId } from './data/loot';

export function startAction() {
  const action = getAction();
  if (action.status !== 'idle') return;
  const encounter = getEncounter();
  const isActive = encounter.type === 'monster' ? encounter.monster.status === 'active' : encounter.event.status === 'active';
  if (!isActive) return;
  setActionActive(Date.now());
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

  const encounter = getEncounter();
  if (encounter.type === 'monster') {
    const { monster } = encounter;
    if (monster.status === 'dead' && monster.diedAt !== null && Date.now() - monster.diedAt >= ENCOUNTER_END_MS) {
      spawnNextEncounter();
    }
  } else {
    const { event } = encounter;
    if (event.status === 'resolved' && event.resolvedAt !== null && Date.now() - event.resolvedAt >= ENCOUNTER_END_MS) {
      spawnNextEncounter();
    }
  }
}

// Shared by monster kills and 'loot' event outcomes — xp/inventory/floating
// text don't care which kind of encounter produced the drops.
function awardLoot(dropTableId: readonly string[], xpReward: number) {
  const drops = resolveDropIds(dropTableId);
  awardXp(xpReward);
  for (const dropId of drops) addItem(dropId, 1);
  for (const dropId of drops) spawnLootText(`+1 ${ITEMS[dropId].name}`, ITEMS[dropId].rarity);
}

function resolveHit() {
  const encounter = getEncounter();
  spawnFloatingText('-1', 'damage');

  if (encounter.type === 'monster') {
    damageMonster(1);
    if (encounter.monster.hp <= 0) {
      awardLoot(encounter.monster.dropTableId, encounter.monster.xpReward);
      killMonster();
    }
  } else {
    tapEvent();
    if (encounter.event.tapsRemaining <= 0) {
      const { outcome, name } = encounter.event;
      if (outcome.type === 'loot') {
        awardLoot(outcome.dropTableId, outcome.xpReward);
      } else {
        addMercenary(outcome.mercenaryId);
        spawnLootText(`Recruited ${name}!`, 'rare');
      }
      resolveEvent();
    }
  }

  setActionCooldown(Date.now());
}
