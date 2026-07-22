import { GATHER } from './config';
import { getMonster, damageMonster, spawnMonster } from './state/monster.svelte';
import { getAction, setActionActive, setActionIdle } from './state/action.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem } from './state/inventory.svelte';
import { resolveDropId } from './data/loot';

export function startAction() {
  const action = getAction();
  if (action.status !== 'idle') return;
  setActionActive(Date.now());
}

export function tick() {
  const action = getAction();
  if (action.status !== 'active' || action.startedAt === null) return;
  if (Date.now() - action.startedAt < GATHER.activeMs) return;

  resolveAction();
}

function resolveAction() {
  const monster = getMonster();
  damageMonster(1);

  if (monster.hp <= 0) {
    awardXp(monster.xpReward);
    const dropId = resolveDropId(monster.dropTableId);
    if (dropId) addItem(dropId, 1);
    spawnMonster();
  }

  setActionIdle();
}
