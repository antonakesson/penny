// Pure world layout: given (zoneId, distance[, seed]) resolves which subzone
// is active and what POIs anchor within it. Distinct from state/map.svelte.ts,
// which only owns the seed/distance state - nothing here is stored, same
// purity discipline elevationNoise already follows for terrain.
import { ZONES, type ZoneId, type SubZoneDef, type PoiGroupDef } from './data/zones';
import { idHash } from './util/noise';
import { weightedPick } from './util/weighted';
import { getDistance } from './state/map.svelte';
import type { EncounterId } from './data/encounters';

export interface ResolvedSubZone {
  subZone: SubZoneDef;
  start: number;
}

// Walks the zone's ordered, fixed-length subzones and returns the one the
// given distance falls in. O(subzone count), trivial at this scale. The last
// subzone stays active past its own length - no travel graph yet, so there's
// nowhere else to go.
export function resolveSubZone(zoneId: ZoneId, distance: number): ResolvedSubZone {
  const subZones = ZONES[zoneId].subZones;
  let start = 0;
  for (let i = 0; i < subZones.length; i++) {
    const subZone = subZones[i];
    const isLast = i === subZones.length - 1;
    if (isLast || distance < start + subZone.length) return { subZone, start };
    start += subZone.length;
  }
  throw new Error(`resolveSubZone: zone "${zoneId}" has no subzones`);
}

interface ResolvedPoi {
  encounter: EncounterId;
  distance: number;
}

// Anchors a group with one hash roll, keyed by the group's own stable id -
// every member then sits at anchor + its offset. Clamped so the furthest
// member never rolls past the subzone's own span. `at`, when set, skips the
// roll entirely - a fixed landmark, not a placement.
function resolveGroup(group: PoiGroupDef, subZoneStart: number, subZoneLength: number, seed: number): ResolvedPoi[] {
  if (group.at !== undefined) {
    return group.members.map((m) => ({ encounter: m.encounter, distance: group.at! + m.offset }));
  }
  const maxOffset = Math.max(...group.members.map((m) => m.offset));
  const usableSpan = Math.max(0, subZoneLength - maxOffset);
  const anchor = subZoneStart + Math.floor(idHash(group.id, seed) * (usableSpan + 1));
  return group.members.map((m) => ({ encounter: m.encounter, distance: anchor + m.offset }));
}

// Threshold crossing, not an exact match - a POI anchored at distance 73
// still needs to fire if the player's distance jumps from 70 to 76 in one
// batch (multi-kill advance). Walks every subzone in the zone, not just the
// current one, so a one-shot can never be silently skipped by a big jump -
// only "already fired" removes it from consideration. firedIds is keyed by
// encounter id, same set state/events.svelte.ts's firedMask already tracks.
export function resolvePoiAt(
  zoneId: ZoneId,
  distance: number,
  seed: number,
  firedIds: ReadonlySet<EncounterId>,
): EncounterId | undefined {
  const subZones = ZONES[zoneId].subZones;
  let start = 0;
  for (const subZone of subZones) {
    for (const group of subZone.pois ?? []) {
      for (const poi of resolveGroup(group, start, subZone.length, seed)) {
        if (distance >= poi.distance && !firedIds.has(poi.encounter)) return poi.encounter;
      }
    }
    start += subZone.length;
  }
  return undefined;
}

// Deterministic - draws from the active subzone's flat weighted table via
// plain weightedPick (uniform Math.random() roll). No noise signal, no
// authoring tax from shape-matching a bell curve.
export function pickEncounter(zoneId: ZoneId): EncounterId {
  const { subZone } = resolveSubZone(zoneId, getDistance());
  return weightedPick(subZone.encounters.map((e) => [e.id, e.weight] as const));
}

// UI-facing view of "where the player is right now" - zone identity plus the
// active subzone's flavor text, which is what's actually shown per-distance
// now instead of the zone's own static fields.
export function getCurrentSubZoneView(zoneId: ZoneId, distance: number) {
  const { subZone } = resolveSubZone(zoneId, distance);
  return {
    zoneName: ZONES[zoneId].name,
    name: subZone.name,
    description: subZone.description,
    quote: subZone.quote,
  };
}
