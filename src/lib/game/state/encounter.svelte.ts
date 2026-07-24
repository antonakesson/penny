import { MONSTERS, type MonsterId } from '../data/monstats';
import { EVENTS, type EventId } from '../data/events';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import { resetTreasure, serializeTreasure, hydrateTreasure, type TreasureRuntime } from './treasure.svelte';
import { resetRecruitEvent, serializeRecruitEvent, hydrateRecruitEvent, type RecruitRuntime } from './recruitEvent.svelte';
import { isDiscovered } from './bestiary.svelte';
import type { Monster, Encounter } from '../types';
import { assertNever } from '../util/assertNever';

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

function createNextEncounter(): Encounter {
  const picked = pickEncounter(getCurrentZoneId());
  if (picked.type === 'monster') return { kind: 'monster', monster: createMonster(picked.id) };

  const def = EVENTS[picked.id];
  switch (def.kind) {
    case 'treasure':
      resetTreasure();
      return { kind: 'treasure', id: picked.id };
    case 'pet':
      resetRecruitEvent();
      return { kind: 'pet', id: picked.id };
    default:
      return assertNever(def);
  }
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

export function spawn() {
  current = createNextEncounter();
}

export type EncounterSnapshot =
  | { kind: 'monster'; id: string; hp: number; status: Monster['status']; diedAt: number | null }
  | { kind: 'treasure'; id: string; runtime: TreasureRuntime }
  | { kind: 'pet'; id: string; runtime: RecruitRuntime };

export function serializeEncounter(): EncounterSnapshot {
  switch (current.kind) {
    case 'monster':
      return {
        kind: 'monster',
        id: current.monster.id,
        hp: current.monster.hp,
        status: current.monster.status,
        diedAt: current.monster.diedAt,
      };
    case 'treasure':
      return { kind: 'treasure', id: current.id, runtime: serializeTreasure() };
    case 'pet':
      return { kind: 'pet', id: current.id, runtime: serializeRecruitEvent() };
    default:
      return assertNever(current);
  }
}

export function hydrateEncounter(snapshot: EncounterSnapshot) {
  switch (snapshot.kind) {
    case 'monster':
      current = {
        kind: 'monster',
        monster: { ...createMonster(snapshot.id as MonsterId), hp: snapshot.hp, status: snapshot.status, diedAt: snapshot.diedAt },
      };
      return;
    case 'treasure':
      hydrateTreasure(snapshot.runtime);
      current = { kind: 'treasure', id: snapshot.id as EventId };
      return;
    case 'pet':
      hydrateRecruitEvent(snapshot.runtime);
      current = { kind: 'pet', id: snapshot.id as EventId };
      return;
    default:
      return assertNever(snapshot);
  }
}
