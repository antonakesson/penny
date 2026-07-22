import { MONSTERS, type MonsterId } from '../data/monstats';
import type { Monster } from '../types';

function createMonster(id: MonsterId): Monster {
  const base = MONSTERS[id];
  return {
    id,
    name: base.name,
    level: base.level,
    entryNo: base.entryNo,
    hp: base.maxHp,
    maxHp: base.maxHp,
    xpReward: base.xpReward,
    dropTableId: base.dropTableId,
  };
}

let current = $state<Monster>(createMonster('boar'));

export function getMonster(): Monster {
  return current;
}

export function damageMonster(amount: number) {
  current.hp = Math.max(0, current.hp - amount);
}

export function spawnMonster(id: MonsterId = 'boar') {
  current = createMonster(id);
}
