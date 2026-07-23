import { MONSTERS, type MonsterId } from '../data/monstats';
import { EVENTS, type EventId } from '../data/events';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import type { Monster, GameEvent, Encounter } from '../types';

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

function createEvent(id: EventId): GameEvent {
  const base = EVENTS[id];
  return {
    instanceId: nextInstanceId++,
    id,
    name: base.name,
    entryNo: base.entryNo,
    tapsRequired: base.tapsRequired,
    tapsRemaining: base.tapsRequired,
    outcome: base.outcome,
    status: 'active',
    resolvedAt: null,
  };
}

function createNextEncounter(): Encounter {
  const picked = pickEncounter(getCurrentZoneId());
  return picked.type === 'monster'
    ? { type: 'monster', monster: createMonster(picked.id) }
    : { type: 'event', event: createEvent(picked.id) };
}

let current = $state<Encounter>(createNextEncounter());

export function getEncounter(): Encounter {
  return current;
}

export function damageMonster(amount: number) {
  if (current.type !== 'monster') return;
  current.monster.hp = Math.max(0, current.monster.hp - amount);
}

export function killMonster() {
  if (current.type !== 'monster') return;
  current.monster.status = 'dead';
  current.monster.diedAt = Date.now();
}

export function tapEvent() {
  if (current.type !== 'event') return;
  current.event.tapsRemaining = Math.max(0, current.event.tapsRemaining - 1);
}

export function resolveEvent() {
  if (current.type !== 'event') return;
  current.event.status = 'resolved';
  current.event.resolvedAt = Date.now();
}

export function spawnNextEncounter() {
  current = createNextEncounter();
}

export type EncounterSnapshot =
  | { type: 'monster'; id: string; hp: number; status: Monster['status']; diedAt: number | null }
  | { type: 'event'; id: string; tapsRemaining: number; status: GameEvent['status']; resolvedAt: number | null };

export function serializeEncounter(): EncounterSnapshot {
  if (current.type === 'monster') {
    return {
      type: 'monster',
      id: current.monster.id,
      hp: current.monster.hp,
      status: current.monster.status,
      diedAt: current.monster.diedAt,
    };
  }
  return {
    type: 'event',
    id: current.event.id,
    tapsRemaining: current.event.tapsRemaining,
    status: current.event.status,
    resolvedAt: current.event.resolvedAt,
  };
}

export function hydrateEncounter(snapshot: EncounterSnapshot) {
  current =
    snapshot.type === 'monster'
      ? {
          type: 'monster',
          monster: { ...createMonster(snapshot.id as MonsterId), hp: snapshot.hp, status: snapshot.status, diedAt: snapshot.diedAt },
        }
      : {
          type: 'event',
          event: {
            ...createEvent(snapshot.id as EventId),
            tapsRemaining: snapshot.tapsRemaining,
            status: snapshot.status,
            resolvedAt: snapshot.resolvedAt,
          },
        };
}
