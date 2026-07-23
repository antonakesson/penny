import type { ZoneId } from '../data/zones';

let currentZoneId = $state<ZoneId>('zone1');

export function getCurrentZoneId(): ZoneId {
  return currentZoneId;
}

export function hydrateZone(id: ZoneId) {
  currentZoneId = id;
}
