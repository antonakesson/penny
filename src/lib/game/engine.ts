import { ACTION, MONSTER_DEATH_MS } from './config';
import { getMonster, damageMonster, spawnMonster, killMonster } from './state/monster.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem } from './state/inventory.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS, type ItemId } from './data/loot';

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

interface HitResult {
  xpReward: number;
  drops: ItemId[];
}

// One damage tick against the current monster; returns the kill payload
// (xp + drops) if that hit finished it off.
function applyHit(): HitResult | null {
  const monster = getMonster();
  damageMonster(1);
  if (monster.hp > 0) return null;

  const xpReward = monster.xpReward;
  const drops = resolveDropIds(monster.dropTableId);
  awardXp(xpReward);
  for (const dropId of drops) addItem(dropId, 1);
  killMonster();
  return { xpReward, drops };
}

function resolveAction() {
  spawnFloatingText('-1', 'damage');
  const result = applyHit();
  if (result) {
    for (const dropId of result.drops) {
      spawnLootText(`+1 ${ITEMS[dropId].name}`, ITEMS[dropId].rarity);
    }
  }
  setActionCooldown(Date.now());
}
