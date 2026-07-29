import { MONSTERS, type MonsterId } from '../data/monstats';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import { isDiscovered } from './bestiary.svelte';
import type { Monster } from '../types';

let nextInstanceId = 1;

export function createMonster(id: MonsterId): Monster {
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
    action: base.action ?? 'attack',
  };
}

// Throwaway initial value - almost always immediately replaced by
// hydrateEncounter() on load. Deliberately just a plain zone pick, never
// event-aware: this runs before any save is hydrated (distance/firedMask
// both still at their defaults), so an event roll here would either be
// meaningless (distance 0 is always below any event's eligible band) or,
// worse, burn a one-shot event on a Monster instance nobody ever sees.
// Real "what's next" decisions belong entirely to engine.ts's
// decideNextEncounter() - this module no longer knows events exist.
let current = $state<Monster>(createMonster(pickEncounter(getCurrentZoneId())));

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

// Dumb setter - engine.ts decides which Monster comes next and hands it
// here. This module just holds and mutates the current encounter, it
// doesn't choose it.
export function spawn(monster: Monster) {
  current = monster;
}

export interface EncounterSnapshot {
  id: string;
  hp: number;
  status: Monster['status'];
  diedAt: number | null;
  isNewDiscovery: boolean;
}

export function serializeEncounter(): EncounterSnapshot {
  return {
    id: current.id,
    hp: current.hp,
    status: current.status,
    diedAt: current.diedAt,
    isNewDiscovery: current.isNewDiscovery,
  };
}

// createMonster() would recompute isNewDiscovery from the current bestiary
// mask - which, by reload time, already says "discovered" (the Bestiary
// marks a monster discovered almost immediately on spawn, well before
// it's persisted). That's the exact "vanishes within a tick" bug this
// field's own snapshot-at-creation was meant to prevent, just reached via
// reload instead of live play. Override with the persisted value instead
// of trusting the freshly recomputed one.
export function hydrateEncounter(snapshot: EncounterSnapshot) {
  current = {
    ...createMonster(snapshot.id as MonsterId),
    hp: snapshot.hp,
    status: snapshot.status,
    diedAt: snapshot.diedAt,
    isNewDiscovery: snapshot.isNewDiscovery,
  };
}
