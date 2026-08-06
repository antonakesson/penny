import {
  ENCOUNTERS,
  type EncounterId,
  type MonsterDef,
  type InvestigationDef,
  type SocialDef,
  type CrossroadDef,
} from '../data/encounters';
import { MONSTER_ENTITIES, INVESTIGATION_ENTITIES } from '../data/entities';
import { pickEncounter } from '../map';
import { getCurrentZoneId } from './zone.svelte';
import { getDifficulty } from './map.svelte';
import { channelDps } from '../data/skills';
import { assertNever } from '../util/assertNever';
import type { Encounter, Monster, Investigation, Social, Crossroad } from '../types';
import type { DialogNodeId } from '../data/dialog';
import type { NpcId } from '../data/npc';

let nextInstanceId = 1;

// No per-monster-identity scaling - hp/xp start from the entity's own
// honestly-authored numbers (data/entities.ts). A tougher version of a
// monster is a separate entity/id (e.g. a future mediumBoar) rather than
// the same id stretched by a formula; see enemy_design_scope / the zones.ts
// level-removal for why.
//
// What DOES still scale live is session intensity: the difficulty signal
// (0..1, resamples as distance changes) lerped to a 0..2 multiplier, applied
// on top of the declared base so relative toughness between monsters is
// preserved. Baked once here at spawn time, not recomputed mid-fight - same
// "vanishes/drifts within a tick" bug class snapshotToEncounter's comment
// already warns about for level. Floored at 1 so a low-difficulty roll can
// never produce a free/0-hp kill.
function createMonster(id: EncounterId, def: MonsterDef, level: number): Monster {
  const entity = MONSTER_ENTITIES[def.entity];
  const scale = getDifficulty() * 2;
  const maxHp = Math.max(1, Math.round(entity.maxHp * scale));
  const xpReward = Math.max(1, Math.round(entity.xpReward * scale));
  return {
    instanceId: nextInstanceId++,
    id,
    name: entity.name,
    action: 'attack',
    level,
    hp: maxHp,
    maxHp,
    xpReward,
    dropTableId: entity.dropTableId,
    status: 'active',
    diedAt: null,
  };
}

// maxHp is derived from the entity's honestly-authored durationMs against
// the rate the Investigate skill actually drains at, not authored directly
// as a guessed hp number - see ENCOUNTER_REFACTOR.md decision 3. Reading the
// rate off the skill def (rather than a config knob beside it) is what keeps
// a retuned channel and the hp it has to chew through from drifting apart.
// No level scaling: an investigation isn't a zone-difficulty-scaled
// encounter.
function createInvestigation(id: EncounterId, def: InvestigationDef): Investigation {
  const entity = INVESTIGATION_ENTITIES[def.entity];
  const maxHp = Math.max(1, Math.round((entity.durationMs / 1000) * channelDps('investigate')));
  return {
    instanceId: nextInstanceId++,
    id,
    name: entity.name,
    action: 'investigate',
    hp: maxHp,
    maxHp,
    xpReward: entity.xpReward,
    dropTableId: entity.dropTableId,
    status: 'active',
    diedAt: null,
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
    nameOverrides: {},
    visitedChoiceIds: [],
    status: 'active',
    diedAt: null,
  };
}

function createCrossroad(id: EncounterId, def: CrossroadDef): Crossroad {
  return {
    instanceId: nextInstanceId++,
    id,
    name: def.name,
    action: 'crossroad',
    branches: def.branches,
    status: 'active',
    diedAt: null,
  };
}

// The one place that turns a shape-blind id into a concrete Encounter -
// map.ts's pickEncounter() and resolvePoiAt() only ever hand back an id,
// blind to what kind it resolves to. level defaults to the
// def's own authored level (i.e. no scaling) for kinds that have one - event
// / one-shot encounters that don't pass one get their hardcoded stats
// untouched; investigation ignores it entirely, it has no level concept.
export function createEncounter(id: EncounterId, level?: number): Encounter {
  const def = ENCOUNTERS[id];
  switch (def.kind) {
    case 'monster':
      return createMonster(id, def, level ?? MONSTER_ENTITIES[def.entity].level);
    case 'investigation':
      return createInvestigation(id, def);
    case 'social':
      return createSocial(id, def, level ?? def.level);
    case 'crossroad':
      return createCrossroad(id, def);
    default:
      return assertNever(def);
  }
}

// Array, not a single slot: front (current[0]) is the only active encounter.
// Anything behind it is paused, not queued - it resumes where it left off
// once whatever's in front resolves.
//
// Throwaway initial value - almost always immediately replaced by
// hydrateEncounter() on load. Deliberately just a plain zone pick, not a POI
// resolution: this runs before any save is hydrated (distance still at its
// default of 0), so a POI check here would either be meaningless or, worse,
// burn a POI anchored at/near distance 0 on an instance nobody ever sees.
// Real "what's next" decisions belong entirely to engine.ts's
// decideNextEncounter().
let current = $state<Encounter[]>([createEncounter(pickEncounter(getCurrentZoneId()))]);

export function getEncounter(): Encounter {
  return current[0];
}

// Whatever's paused behind the active front - e.g. the boss a player was
// mid-fight against before a genie cut in. UI-only peek, nothing reads this
// to decide game logic.
export function getPausedEncounters(): readonly Encounter[] {
  return current.slice(1);
}

export function hasEncounter(): boolean {
  return current.length > 0;
}

// Cuts to the front - the previously-active encounter (if any) isn't lost,
// it's shifted back to index 1 and picks up again once this one resolves.
// Same operation covers both real interrupts (an item's launchEncounter
// effect, mid-fight) and the empty-array case (engine.ts's tick(), nothing
// was active at all) - unshift into an empty array is just push, so there's
// no special-casing needed for "nothing to preempt."
export function interruptEncounter(encounter: Encounter) {
  current.unshift(encounter);
}

// Drops the front - called once the active encounter has fully resolved
// (death animation elapsed / dialog reached a terminal node). Whatever was
// paused behind it becomes the new front automatically, revealed exactly as
// it was left (hp, status, dialog node); if nothing was behind it, the array
// is left empty and it's the caller's job (engine.ts) to interruptEncounter()
// a freshly-decided one.
export function dropEncounter() {
  current.shift();
}

// Only meaningful for hp-drain kinds - callers only ever reach this after
// currentHandler()'s attack/investigate path resolves a hit, which never
// happens for a social encounter (see engine.ts), but the guard keeps this
// module's own invariant self-evident rather than relying on the caller.
export function damageMonster(amount: number) {
  const encounter = current[0];
  if (encounter.action !== 'attack' && encounter.action !== 'investigate') return;
  encounter.hp = Math.max(0, encounter.hp - amount);
}

// The one place `currentNode` mutates - single-writer, same rule every
// other slice in this module follows. Guarded on 'social' the same way
// damageMonster() guards on the hp-drain kinds; engine.ts's
// resolveDialogChoice() is the only caller. uniqueId is the picked choice's
// own DialogChoice.uniqueId (absent for choices that aren't one-shot) -
// recorded here, alongside currentNode, so both mutate in the same call.
export function pickDialogChoice(next: DialogNodeId, uniqueId?: string) {
  const encounter = current[0];
  if (encounter.action !== 'social') return;
  encounter.currentNode = next;
  if (uniqueId && !encounter.visitedChoiceIds.includes(uniqueId)) {
    encounter.visitedChoiceIds = [...encounter.visitedChoiceIds, uniqueId];
  }
}

// A dialog `rename` line's only effect - same single-writer rule as
// pickDialogChoice(). engine.ts's resolveDialogChoice() is the only caller.
export function setCharacterName(character: NpcId, name: string) {
  const encounter = current[0];
  if (encounter.action !== 'social') return;
  encounter.nameOverrides[character] = name;
}

// Base Encounter behavior, not per-kind - status/diedAt live on every
// variant, so this applies uniformly regardless of what's currently active.
export function killMonster() {
  current[0].status = 'dead';
  current[0].diedAt = Date.now();
}

// Force-replaces the entire queue with a single encounter - not the normal
// flow (see queueEncounter/dropEncounter), this is a hard reset. Only
// DevTools uses it today, to jump straight to an arbitrary encounter for
// testing without waiting out whatever's currently active or queued.
export function spawn(encounter: Encounter) {
  current = [encounter];
}

interface EncounterSnapshotBase {
  id: string;
  status: Encounter['status'];
  diedAt: number | null;
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
  // reconstructs it fresh. currentNode/nameOverrides are the fields that
  // actually drift from spawn-time, same reasoning as Monster's level (see
  // hydrateEncounter()'s comment below).
  currentNode: DialogNodeId;
  nameOverrides: Partial<Record<NpcId, string>>;
  visitedChoiceIds: readonly string[];
}

// branches isn't persisted - it's def-derived and createEncounter()
// reconstructs it fresh, same reasoning as Social's dialogRoot above. Nothing
// about a crossroad drifts from spawn-time.
interface CrossroadSnapshot extends EncounterSnapshotBase {
  action: 'crossroad';
}

export type EncounterSnapshot = MonsterSnapshot | InvestigationSnapshot | SocialSnapshot | CrossroadSnapshot;

function encounterToSnapshot(encounter: Encounter): EncounterSnapshot {
  const base: EncounterSnapshotBase = {
    id: encounter.id,
    status: encounter.status,
    diedAt: encounter.diedAt,
  };
  switch (encounter.action) {
    case 'attack':
      return {
        ...base,
        action: 'attack',
        level: encounter.level,
        hp: encounter.hp,
        maxHp: encounter.maxHp,
        xpReward: encounter.xpReward,
      };
    case 'investigate':
      return {
        ...base,
        action: 'investigate',
        hp: encounter.hp,
        maxHp: encounter.maxHp,
        xpReward: encounter.xpReward,
      };
    case 'social':
      return {
        ...base,
        action: 'social',
        level: encounter.level,
        currentNode: encounter.currentNode,
        nameOverrides: encounter.nameOverrides,
        visitedChoiceIds: encounter.visitedChoiceIds,
      };
    case 'crossroad':
      return { ...base, action: 'crossroad' };
    default:
      return assertNever(encounter);
  }
}

// Whole queue, front to back - a queued genie behind the active fight is
// real state, not a UI illusion, so it survives a reload the same way the
// active encounter does (see the array's own comment above).
export function serializeEncounter(): EncounterSnapshot[] {
  return current.map(encounterToSnapshot);
}

// createEncounter() would recompute level/maxHp/xpReward from current live
// state instead of what was true at spawn time - level would re-roll from
// wherever distance/difficulty sit *now*, which could easily differ from
// the roll at spawn. That's the same "vanishes/drifts within a tick" bug
// class snapshotToEncounter exists to avoid elsewhere, just reached via
// reload instead of live play. Reconstruct via createEncounter() for the
// def-derived fields
// (name/dropTableId/etc.), then overlay every spawn-time-dependent field
// with the persisted value instead of trusting a fresh recompute.
function snapshotToEncounter(snapshot: EncounterSnapshot): Encounter {
  const id = snapshot.id as EncounterId;
  switch (snapshot.action) {
    case 'attack':
      return {
        ...(createEncounter(id, snapshot.level) as Monster),
        level: snapshot.level,
        hp: snapshot.hp,
        maxHp: snapshot.maxHp,
        xpReward: snapshot.xpReward,
        status: snapshot.status,
        diedAt: snapshot.diedAt,
      };
    case 'investigate':
      return {
        ...(createEncounter(id) as Investigation),
        hp: snapshot.hp,
        maxHp: snapshot.maxHp,
        xpReward: snapshot.xpReward,
        status: snapshot.status,
        diedAt: snapshot.diedAt,
      };
    case 'social':
      return {
        ...(createEncounter(id, snapshot.level) as Social),
        level: snapshot.level,
        currentNode: snapshot.currentNode,
        nameOverrides: snapshot.nameOverrides,
        // ?? [] - older saves predate this field.
        visitedChoiceIds: snapshot.visitedChoiceIds ?? [],
        status: snapshot.status,
        diedAt: snapshot.diedAt,
      };
    case 'crossroad':
      return {
        ...(createEncounter(id) as Crossroad),
        status: snapshot.status,
        diedAt: snapshot.diedAt,
      };
    default:
      return assertNever(snapshot);
  }
}

export function hydrateEncounter(snapshots: EncounterSnapshot[]) {
  current = snapshots.map(snapshotToEncounter);
}
