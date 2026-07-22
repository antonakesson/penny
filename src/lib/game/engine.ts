import { ACTION, MONSTER_DEATH_MS } from './config';
import { getMonster, damageMonster, spawnMonster, killMonster } from './state/monster.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem } from './state/inventory.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS } from './data/loot';

export function startAction() {
  const action = getAction();
  if (action.status !== 'idle') return;
  if (getMonster().status !== 'active') return;
  setActionActive(Date.now());
}

export function tick() {
  const action = getAction();
  if (action.startedAt !== null) {
    const elapsed = Date.now() - action.startedAt;
    if (action.status === 'active') {
      if (elapsed >= ACTION.activeMs) resolveAction();
    } else if (action.status === 'cooldown') {
      if (elapsed >= ACTION.cooldownMs) setActionIdle();
    }
  }

  const monster = getMonster();
  if (monster.status === 'dead' && monster.diedAt !== null && Date.now() - monster.diedAt >= MONSTER_DEATH_MS) {
    spawnMonster();
  }
}

function resolveAction() {
  const monster = getMonster();
  damageMonster(1);
  spawnFloatingText('-1', 'damage');

  if (monster.hp <= 0) {
    awardXp(monster.xpReward);
    for (const dropId of resolveDropIds(monster.dropTableId)) {
      addItem(dropId, 1);
      spawnLootText(`+1 ${ITEMS[dropId].name}`);
    }
    killMonster();
  }

  setActionCooldown(Date.now());
}
