// Pure world layout: given (zoneId, distance[, seed]) resolves which subzone
// is active and what POIs anchor within it. Distinct from state/map.svelte.ts,
// which only owns the seed/distance state - nothing here is stored, same
// purity discipline elevationNoise already follows for terrain.
import { ZONES, type ZoneId, type SubZoneDef, type PoiGroupDef } from './data/zones';
import { idHash } from './util/noise';
import { weightedPick } from './util/weighted';
import { getDistance } from './state/map.svelte';
import { substituteEncounter } from './data/encounters';
import type { EncounterId } from './data/encounters';

export interface ResolvedSubZone {
  subZone: SubZoneDef;
  start: number;
}

// Walks the zone's ordered subzones (each declaring its own startingDistance)
// and returns the one the given distance falls in. O(subzone count), trivial
// at this scale. The last subzone stays active past its own start - no
// travel graph past it yet, so there's nowhere else to go.
export function resolveSubZone(zoneId: ZoneId, distance: number): ResolvedSubZone {
  const subZones = ZONES[zoneId].subZones;
  for (let i = 0; i < subZones.length; i++) {
    const subZone = subZones[i];
    const next = subZones[i + 1];
    if (!next || distance < next.startingDistance) return { subZone, start: subZone.startingDistance };
  }
  throw new Error(`resolveSubZone: zone "${zoneId}" has no subzones`);
}

// A subzone's own span - the gap to the next subzone's start, or Infinity
// for the last one (it has no declared end). Only resolvePoiAt needs this,
// to bound where a hash-placed POI's anchor is allowed to roll (see
// resolveGroup below) - resolveSubZone itself never needs a span, only a
// starting point to compare distance against.
function subZoneSpan(subZones: readonly SubZoneDef[], index: number): number {
  const next = subZones[index + 1];
  return next ? next.startingDistance - subZones[index].startingDistance : Infinity;
}

interface ResolvedPoi {
  encounter: EncounterId;
  distance: number;
}

// Anchors a group with one hash roll, keyed by the group's own stable id -
// every member then sits at anchor + its offset. Clamped so the furthest
// member never rolls past the subzone's own span. `at`, when set, skips the
// roll entirely - a fixed landmark, not a placement. Members carry their
// declared id, unsubstituted - substituteEncounter() runs last, at the
// return points below, same as loot.ts's substitute().
function resolveGroup(group: PoiGroupDef, subZoneStart: number, subZoneLength: number, seed: number): ResolvedPoi[] {
  if (group.at !== undefined) {
    return group.members.map((m) => ({ encounter: m.encounter, distance: group.at! + m.offset }));
  }
  const maxOffset = Math.max(...group.members.map((m) => m.offset));
  const usableSpan = Math.max(0, subZoneLength - maxOffset);
  const anchor = subZoneStart + Math.floor(idHash(group.id, seed) * (usableSpan + 1));
  return group.members.map((m) => ({ encounter: m.encounter, distance: anchor + m.offset }));
}

// Exact match, not a threshold - mathematically one-shot with zero stored
// state. `advance()` (state/map.svelte.ts) only ever moves distance by 1, so
// distance is a strict, never-repeating walk during real play: each integer
// value is visited by exactly one decision call, ever, which means each
// POI's hash-resolved anchor distance is reached exactly once, automatically
// - no "already fired" bookkeeping required. (DevTools' devSetDistance can
// jump distance arbitrarily, including backward - that's a deliberate dev
// affordance for re-triggering a POI to test its content, not a case real
// play can produce.) Two POIs landing on the same distance is an authoring
// collision, not something this function defends against - see zones.ts.
export function resolvePoiAt(zoneId: ZoneId, distance: number, seed: number): EncounterId | undefined {
  const subZones = ZONES[zoneId].subZones;
  for (let i = 0; i < subZones.length; i++) {
    const subZone = subZones[i];
    for (const group of subZone.pois ?? []) {
      for (const poi of resolveGroup(group, subZone.startingDistance, subZoneSpan(subZones, i), seed)) {
        if (poi.distance === distance) return substituteEncounter(poi.encounter);
      }
    }
  }
  return undefined;
}

// Deterministic - draws from the active subzone's flat weighted table via
// plain weightedPick (uniform Math.random() roll). No noise signal, no
// authoring tax from shape-matching a bell curve.
export function pickEncounter(zoneId: ZoneId): EncounterId {
  const { subZone } = resolveSubZone(zoneId, getDistance());
  return substituteEncounter(weightedPick(subZone.encounters.map((e) => [e.id, e.weight] as const)));
}

// UI-facing view of "where the player is right now" - identity (ids + display
// names) only. Flavor text (description/quote) isn't mechanical data and
// doesn't live here - the UI looks it up itself via subZoneId, see
// components/data/flavor.ts.
export function getCurrentSubZoneView(zoneId: ZoneId, distance: number) {
  const { subZone } = resolveSubZone(zoneId, distance);
  return {
    zoneId,
    zoneName: ZONES[zoneId].name,
    subZoneId: subZone.id,
    name: subZone.name,
  };
}
