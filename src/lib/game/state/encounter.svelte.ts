import {
  ENCOUNTERS,
  type EncounterId,
  type MonsterDef,
  type InvestigationDef,
  type SocialDef,
} from '../data/encounters';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import { isDiscovered } from './bestiary.svelte';
import { getBestiaryEntry } from '../data/bestiary';
import { NAIVE_SCALE_PER_LEVEL, INVESTIGATE } from '../config';
import { assertNever } from '../util/assertNever';
import type { Encounter, Monster, Investigation, Social } from '../types';
import type { DialogNodeId } from '../data/dialog';

let nextInstanceId = 1;

// Only bestiary-listed encounters get discovery-tracked at all - a one-shot
// event or unfinished placeholder with no BestiaryEntry has nothing to
// "discover", so it never gets the reveal treatment.
function isNewDiscoveryFor(name: string): boolean {
  const entry = getBestiaryEntry(name);
  return entry !== undefined && !isDiscovered(entry.entryNo);
}

// Naive step-1 scaling: flat per-level multiplier is a placeholder - see
// NAIVE_SCALE_PER_LEVEL, replaced by a real curve in step 2.
function createMonster(id: EncounterId, def: MonsterDef, level: number): Monster {
  const scale = 1 + NAIVE_SCALE_PER_LEVEL * (level - def.level);
  const maxHp = Math.max(1, Math.round(def.maxHp * scale));
  const xpReward = Math.max(1, Math.round(def.xpReward * scale));
  return {
    instanceId: nextInstanceId++,
    id,
    name: def.name,
    action: 'attack',
    level,
    hp: maxHp,
    maxHp,
    xpReward,
    dropTableId: def.dropTableId,
    status: 'active',
    diedAt: null,
    isNewDiscovery: isNewDiscoveryFor(def.name),
  };
}

// maxHp is derived from the def's honestly-authored durationMs against the
// investigate dps knob, not authored directly as a guessed hp number - see
// ENCOUNTER_REFACTOR.md decision 3. No level scaling: an investigation isn't
// a zone-difficulty-scaled encounter.
function createInvestigation(id: EncounterId, def: InvestigationDef): Investigation {
  const maxHp = Math.max(1, Math.round((def.durationMs / 1000) * INVESTIGATE.dps));
  return {
    instanceId: nextInstanceId++,
    id,
    name: def.name,
    action: 'investigate',
    hp: maxHp,
    maxHp,
    xpReward: def.xpReward,
    dropTableId: def.dropTableId,
    status: 'active',
    diedAt: null,
    isNewDiscovery: isNewDiscoveryFor(def.name),
  };
}

function createSocial(id: EncounterId, def: SocialDef, level: number): Social {
  return {
    instanceId: nextInstanceId++,
    id,
    name: def.name,
    action: 'social',
    level,
    dialogRoot: def.dialogRoot,
    currentNode: def.dialogRoot,
    status: 'active',
    diedAt: null,
    isNewDiscovery: isNewDiscoveryFor(def.name),
  };
}

// The one place that turns a shape-blind id into a concrete Encounter -
// zones.ts's pool and events.svelte.ts's shouldShowEvent() only ever hand
// back an id, blind to what kind it resolves to. level defaults to the
// def's own authored level (i.e. no scaling) for kinds that have one - event
// / one-shot encounters that don't pass one get their hardcoded stats
// untouched; investigation ignores it entirely, it has no level concept.
export function createEncounter(id: EncounterId, level?: number): Encounter {
  const def = ENCOUNTERS[id];
  switch (def.kind) {
    case 'monster':
      return createMonster(id, def, level ?? def.level);
    case 'investigation':
      return createInvestigation(id, def);
    case 'social':
      return createSocial(id, def, level ?? def.level);
    default:
      return assertNever(def);
  }
}

// Throwaway initial value - almost always immediately replaced by
// hydrateEncounter() on load. Deliberately just a plain zone pick, never
// event-aware: this runs before any save is hydrated (distance/firedMask
// both still at their defaults), so an event roll here would either be
// meaningless (distance 0 is always below any event's eligible band) or,
// worse, burn a one-shot event on an instance nobody ever sees. Real "what's
// next" decisions belong entirely to engine.ts's decideNextEncounter() -
// this module no longer knows events exist.
let current = $state<Encounter>(createEncounter(pickEncounter(getCurrentZoneId())));

export function getEncounter(): Encounter {
  return current;
}

// Only meaningful for hp-drain kinds - callers only ever reach this after
// currentHandler()'s attack/investigate path resolves a hit, which never
// happens for a social encounter (see engine.ts), but the guard keeps this
// module's own invariant self-evident rather than relying on the caller.
export function damageMonster(amount: number) {
  if (current.action === 'social') return;
  current.hp = Math.max(0, current.hp - amount);
}

// The one place `currentNode` mutates - single-writer, same rule every
// other slice in this module follows. Guarded on 'social' the same way
// damageMonster() guards on the hp-drain kinds; engine.ts's
// resolveDialogChoice() is the only caller.
export function pickDialogChoice(next: DialogNodeId) {
  if (current.action !== 'social') return;
  current.currentNode = next;
}

// Base Encounter behavior, not per-kind - status/diedAt live on every
// variant, so this applies uniformly regardless of what's currently active.
export function killMonster() {
  current.status = 'dead';
  current.diedAt = Date.now();
}

// Dumb setter - engine.ts decides which Encounter comes next and hands it
// here. This module just holds and mutates the current encounter, it
// doesn't choose it.
export function spawn(encounter: Encounter) {
  current = encounter;
}

interface EncounterSnapshotBase {
  id: string;
  status: Encounter['status'];
  diedAt: number | null;
  isNewDiscovery: boolean;
}

interface MonsterSnapshot extends EncounterSnapshotBase {
  action: 'attack';
  level: number;
  hp: number;
  maxHp: number;
  xpReward: number;
}

interface InvestigationSnapshot extends EncounterSnapshotBase {
  action: 'investigate';
  hp: number;
  maxHp: number;
  xpReward: number;
}

interface SocialSnapshot extends EncounterSnapshotBase {
  action: 'social';
  level: number;
  // dialogRoot isn't persisted - it's def-derived and createEncounter()
  // reconstructs it fresh. currentNode is the one field that actually
  // drifts from spawn-time, same reasoning as Monster's level (see
  // hydrateEncounter()'s comment below).
  currentNode: DialogNodeId;
}

export type EncounterSnapshot = MonsterSnapshot | InvestigationSnapshot | SocialSnapshot;

export function serializeEncounter(): EncounterSnapshot {
  const base: EncounterSnapshotBase = {
    id: current.id,
    status: current.status,
    diedAt: current.diedAt,
    isNewDiscovery: current.isNewDiscovery,
  };
  switch (current.action) {
    case 'attack':
      return {
        ...base,
        action: 'attack',
        level: current.level,
        hp: current.hp,
        maxHp: current.maxHp,
        xpReward: current.xpReward,
      };
    case 'investigate':
      return { ...base, action: 'investigate', hp: current.hp, maxHp: current.maxHp, xpReward: current.xpReward };
    case 'social':
      return { ...base, action: 'social', level: current.level, currentNode: current.currentNode };
    default:
      return assertNever(current);
  }
}

// createEncounter() would recompute level/maxHp/xpReward/isNewDiscovery from
// current live state instead of what was true at spawn time - level would
// re-roll from wherever distance/difficulty sit *now* (could easily differ
// from the roll at spawn), and isNewDiscovery would read the bestiary mask
// which, by reload time, already says "discovered" (marked almost
// immediately on spawn, well before persistence). Both are the same
// "vanishes/drifts within a tick" bug, just reached via reload instead of
// live play. Reconstruct via createEncounter() for the def-derived fields
// (name/dropTableId/etc.), then overlay every spawn-time-dependent field
// with the persisted value instead of trusting a fresh recompute.
export function hydrateEncounter(snapshot: EncounterSnapshot) {
  const id = snapshot.id as EncounterId;
  switch (snapshot.action) {
    case 'attack':
      current = {
        ...(createEncounter(id, snapshot.level) as Monster),
        level: snapshot.level,
        hp: snapshot.hp,
        maxHp: snapshot.maxHp,
        xpReward: snapshot.xpReward,
        status: snapshot.status,
        diedAt: snapshot.diedAt,
        isNewDiscovery: snapshot.isNewDiscovery,
      };
      return;
    case 'investigate':
      current = {
        ...(createEncounter(id) as Investigation),
        hp: snapshot.hp,
        maxHp: snapshot.maxHp,
        xpReward: snapshot.xpReward,
        status: snapshot.status,
        diedAt: snapshot.diedAt,
        isNewDiscovery: snapshot.isNewDiscovery,
      };
      return;
    case 'social':
      current = {
        ...(createEncounter(id, snapshot.level) as Social),
        level: snapshot.level,
        currentNode: snapshot.currentNode,
        status: snapshot.status,
        diedAt: snapshot.diedAt,
        isNewDiscovery: snapshot.isNewDiscovery,
      };
      return;
    default:
      assertNever(snapshot);
  }
}
