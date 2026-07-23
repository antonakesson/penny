import { MONSTERS, type MonsterId } from '../data/monstats';
import { pickMonsterId } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import type { Monster } from '../types';

let nextInstanceId = 1;

function createMonster(id: MonsterId): Monster {
  const base = MONSTERS[id];
  return {
    instanceId: nextInstanceId++,
    id,
    name: base.name,
    level: base.level,
    entryNo: base.entryNo,
    hp: base.maxHp,
    maxHp: base.maxHp,
    xpReward: base.xpReward,
    dropTableId: base.dropTableId,
    status: 'active',
    diedAt: null,
  };
}

function createNextMonster(): Monster {
  return createMonster(pickMonsterId(getCurrentZoneId()));
}

let current = $state<Monster>(createNextMonster());

export function getMonster(): Monster {
  return current;
}

export function damageMonster(amount: number) {
  current.hp = Math.max(0, current.hp - amount);
}

export function killMonster() {
  current.status = 'dead';
  current.diedAt = Date.now();
}

export function spawnMonster() {
  current = createNextMonster();
}

export interface MonsterSnapshot {
  id: MonsterId;
  hp: number;
  status: Monster['status'];
  diedAt: number | null;
}

export function serializeMonster(): MonsterSnapshot {
  return { id: current.id as MonsterId, hp: current.hp, status: current.status, diedAt: current.diedAt };
}

export function hydrateMonster(snapshot: MonsterSnapshot) {
  current = { ...createMonster(snapshot.id), hp: snapshot.hp, status: snapshot.status, diedAt: snapshot.diedAt };
}
