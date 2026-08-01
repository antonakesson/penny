import {
  ENCOUNTERS,
  type EncounterId,
  type MonsterDef,
  type InvestigationDef,
  type SocialDef,
} from '../data/encounters';
import { pickEncounter } from '../data/zones';
import { getCurrentZoneId } from './zone.svelte';
import { getDifficulty } from './map.svelte';
import { isDiscovered } from './bestiary.svelte';
import { getBestiaryEntry } from '../data/bestiary';
import { INVESTIGATE } from '../config';
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

// No per-monster-identity scaling - hp/xp start from the def's own
// honestly-authored numbers. A tougher version of a monster is a separate
// def/id (e.g. a future mediumBoar) rather than the same id stretched by a
// formula; see enemy_design_scope / the zones.ts level-removal for why.
//
// What DOES still scale live is session intensity: the difficulty signal
// (0..1, resamples as distance changes) lerped to a 0..2 multiplier, applied
// on top of the declared base so relative toughness between monsters is
// preserved. Baked once here at spawn time, not recomputed mid-fight - same
// "vanishes/drifts within a tick" bug class snapshotToEncounter's comment
// already warns about for level. Floored at 1 so a low-difficulty roll can
// never produce a free/0-hp kill.
function createMonster(id: EncounterId, def: MonsterDef, level: number): Monster {
  const scale = getDifficulty() * 2;
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

// Array, not a single slot - front (current[0]) is the one and only active
// encounter today, exactly like the old single-slot model. Anything behind
// the front is paused, not queued: it was active, got cut in front of (e.g.
// a genie interrupting a fight), and resumes exactly where it left off once
// whatever's in front of it resolves. This is deliberately partial
// future-proofing (see architecture_state_ownership /
// launch_encounter_queue memory) - a Social always resolves alone at the
// front, since only the front is ever active; nothing here yet supports N
// simultaneously-active monsters/AoE, that's a real future rewrite (mutex,
// damage resolution, UI), not something this array shape tries to solve
// today. The state stays honest about what's actually paused even though
// the UI only ever renders the front.
//
// Throwaway initial value - almost always immediately replaced by
// hydrateEncounter() on load. Deliberately just a plain zone pick, never
// event-aware: this runs before any save is hydrated (distance/firedMask
// both still at their defaults), so an event roll here would either be
// meaningless (distance 0 is always below any event's eligible band) or,
// worse, burn a one-shot event on an instance nobody ever sees. Real "what's
// next" decisions belong entirely to engine.ts's decideNextEncounter() -
// this module no longer knows events exist.
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
  if (encounter.action === 'social') return;
  encounter.hp = Math.max(0, encounter.hp - amount);
}

// The one place `currentNode` mutates - single-writer, same rule every
// other slice in this module follows. Guarded on 'social' the same way
// damageMonster() guards on the hp-drain kinds; engine.ts's
// resolveDialogChoice() is the only caller.
export function pickDialogChoice(next: DialogNodeId) {
  const encounter = current[0];
  if (encounter.action !== 'social') return;
  encounter.currentNode = next;
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

function encounterToSnapshot(encounter: Encounter): EncounterSnapshot {
  const base: EncounterSnapshotBase = {
    id: encounter.id,
    status: encounter.status,
    diedAt: encounter.diedAt,
    isNewDiscovery: encounter.isNewDiscovery,
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
      return { ...base, action: 'social', level: encounter.level, currentNode: encounter.currentNode };
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
        isNewDiscovery: snapshot.isNewDiscovery,
      };
    case 'investigate':
      return {
        ...(createEncounter(id) as Investigation),
        hp: snapshot.hp,
        maxHp: snapshot.maxHp,
        xpReward: snapshot.xpReward,
        status: snapshot.status,
        diedAt: snapshot.diedAt,
        isNewDiscovery: snapshot.isNewDiscovery,
      };
    case 'social':
      return {
        ...(createEncounter(id, snapshot.level) as Social),
        level: snapshot.level,
        currentNode: snapshot.currentNode,
        status: snapshot.status,
        diedAt: snapshot.diedAt,
        isNewDiscovery: snapshot.isNewDiscovery,
      };
    default:
      return assertNever(snapshot);
  }
}

export function hydrateEncounter(snapshots: EncounterSnapshot[]) {
  current = snapshots.map(snapshotToEncounter);
}
