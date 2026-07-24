import { MONSTERS, type MonsterId } from '../data/monstats';
import { EVENTS, type EventId } from '../data/events';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import { resetTreasure, serializeTreasure, hydrateTreasure, type TreasureRuntime } from './treasure.svelte';
import { resetRecruitEvent, serializeRecruitEvent, hydrateRecruitEvent, type RecruitRuntime } from './recruitEvent.svelte';
import type { Monster, Encounter } from '../types';

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

function createNextEncounter(): Encounter {
  const picked = pickEncounter(getCurrentZoneId());
  if (picked.type === 'monster') return { kind: 'monster', monster: createMonster(picked.id) };

  const def = EVENTS[picked.id];
  if (def.kind === 'treasure') {
    resetTreasure();
    return { kind: 'treasure', id: picked.id };
  }
  resetRecruitEvent();
  return { kind: 'recruit', id: picked.id };
}

let current = $state<Encounter>(createNextEncounter());

export function getEncounter(): Encounter {
  return current;
}

export function damageMonster(amount: number) {
  if (current.kind !== 'monster') return;
  current.monster.hp = Math.max(0, current.monster.hp - amount);
}

export function killMonster() {
  if (current.kind !== 'monster') return;
  current.monster.status = 'dead';
  current.monster.diedAt = Date.now();
}

export function spawnNextEncounter() {
  current = createNextEncounter();
}

export type EncounterSnapshot =
  | { kind: 'monster'; id: string; hp: number; status: Monster['status']; diedAt: number | null }
  | { kind: 'treasure'; id: string; runtime: TreasureRuntime }
  | { kind: 'recruit'; id: string; runtime: RecruitRuntime };

export function serializeEncounter(): EncounterSnapshot {
  if (current.kind === 'monster') {
    return {
      kind: 'monster',
      id: current.monster.id,
      hp: current.monster.hp,
      status: current.monster.status,
      diedAt: current.monster.diedAt,
    };
  }
  if (current.kind === 'treasure') {
    return { kind: 'treasure', id: current.id, runtime: serializeTreasure() };
  }
  return { kind: 'recruit', id: current.id, runtime: serializeRecruitEvent() };
}

export function hydrateEncounter(snapshot: EncounterSnapshot) {
  if (snapshot.kind === 'monster') {
    current = {
      kind: 'monster',
      monster: { ...createMonster(snapshot.id as MonsterId), hp: snapshot.hp, status: snapshot.status, diedAt: snapshot.diedAt },
    };
    return;
  }
  if (snapshot.kind === 'treasure') {
    hydrateTreasure(snapshot.runtime);
    current = { kind: 'treasure', id: snapshot.id as EventId };
    return;
  }
  hydrateRecruitEvent(snapshot.runtime);
  current = { kind: 'recruit', id: snapshot.id as EventId };
}
