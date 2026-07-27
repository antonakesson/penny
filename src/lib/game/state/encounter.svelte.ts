import { MONSTERS, type MonsterId } from '../data/monstats';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import { isDiscovered } from './bestiary.svelte';
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
    isNewDiscovery: !isDiscovered(base.entryNo),
  };
}

function createNextEncounter(): Monster {
  return createMonster(pickEncounter(getCurrentZoneId()));
}

let current = $state<Monster>(createNextEncounter());

export function getEncounter(): Monster {
  return current;
}

export function damageMonster(amount: number) {
  current.hp = Math.max(0, current.hp - amount);
}

export function killMonster() {
  current.status = 'dead';
  current.diedAt = Date.now();
}

export function spawn() {
  current = createNextEncounter();
}

export interface EncounterSnapshot {
  id: string;
  hp: number;
  status: Monster['status'];
  diedAt: number | null;
}

export function serializeEncounter(): EncounterSnapshot {
  return {
    id: current.id,
    hp: current.hp,
    status: current.status,
    diedAt: current.diedAt,
  };
}

export function hydrateEncounter(snapshot: EncounterSnapshot) {
  current = { ...createMonster(snapshot.id as MonsterId), hp: snapshot.hp, status: snapshot.status, diedAt: snapshot.diedAt };
}
