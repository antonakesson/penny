import { MONSTERS, type MonsterId } from '../data/monstats';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import { isDiscovered } from './bestiary.svelte';
import { NAIVE_SCALE_PER_LEVEL } from '../config';
import type { Monster } from '../types';

let nextInstanceId = 1;

// level defaults to the monster's own authored level - i.e. no scaling -
// so callers that don't pass one (event/one-shot monsters like
// hastilyAbandonedCamp) get their hardcoded stats untouched. Only
// zone-table spawns pass an explicit zone-difficulty level (see engine.ts).
export function createMonster(id: MonsterId, level: number = MONSTERS[id].level): Monster {
  const base = MONSTERS[id];
  // Naive step-1 scaling: flat per-level multiplier is a placeholder - see
  // NAIVE_SCALE_PER_LEVEL, replaced by a real curve in step 2.
  const scale = 1 + NAIVE_SCALE_PER_LEVEL * (level - base.level);
  const maxHp = Math.max(1, Math.round(base.maxHp * scale));
  const xpReward = Math.max(1, Math.round(base.xpReward * scale));
  return {
    instanceId: nextInstanceId++,
    id,
    name: base.name,
    level,
    entryNo: base.entryNo,
    hp: maxHp,
    maxHp,
    xpReward,
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
  level: number;
  hp: number;
  maxHp: number;
  xpReward: number;
  status: Monster['status'];
  diedAt: number | null;
  isNewDiscovery: boolean;
}

export function serializeEncounter(): EncounterSnapshot {
  return {
    id: current.id,
    level: current.level,
    hp: current.hp,
    maxHp: current.maxHp,
    xpReward: current.xpReward,
    status: current.status,
    diedAt: current.diedAt,
    isNewDiscovery: current.isNewDiscovery,
  };
}

// createMonster() would recompute level/maxHp/xpReward/isNewDiscovery from
// current live state instead of what was true at spawn time - level would
// re-roll from wherever distance/difficulty sit *now* (could easily differ
// from the roll at spawn), and isNewDiscovery would read the bestiary mask
// which, by reload time, already says "discovered" (marked almost
// immediately on spawn, well before persistence). Both are the same
// "vanishes/drifts within a tick" bug, just reached via reload instead of
// live play. Override every spawn-time-dependent field with the persisted
// value instead of trusting a fresh recompute.
export function hydrateEncounter(snapshot: EncounterSnapshot) {
  current = {
    ...createMonster(snapshot.id as MonsterId),
    level: snapshot.level,
    hp: snapshot.hp,
    maxHp: snapshot.maxHp,
    xpReward: snapshot.xpReward,
    status: snapshot.status,
    diedAt: snapshot.diedAt,
    isNewDiscovery: snapshot.isNewDiscovery,
  };
}
