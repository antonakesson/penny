import type { ZoneId } from '../data/zones';

let currentZoneId = $state<ZoneId>('zone1');

export function getCurrentZoneId(): ZoneId {
  return currentZoneId;
}

// Real-play zone change - crossroadEngine.ts's resolveCrossroadChoice() is
// the only caller. Distinct from hydrateZone() below (a save-load restore)
// same split as advance() vs hydrateMap() in state/map.svelte.ts.
export function switchZone(id: ZoneId) {
  currentZoneId = id;
}

export function hydrateZone(id: ZoneId) {
  currentZoneId = id;
}
