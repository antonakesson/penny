// Fired state is a bitmask, not named ids, so the save file never leaks
// which one-shot story beats exist or have fired. Bit assignments are fixed
// once used - a saved firedMask is only meaningful against the layout that
// wrote it.
import { getDistance, getNumericSeed } from './map.svelte';
import { getCurrentZoneId } from './zone.svelte';
import { resolvePoiAt } from '../map';
import type { EncounterId } from '../data/encounters';

let firedMask = $state<bigint>(0n);

// Pure check - does NOT mark anything fired. That only happens once the
// resulting encounter is actually killed (see markEventFired), so a roll
// that never resolves can't permanently burn a one-shot event unseen.
// Placement itself is resolved by map.ts's resolvePoiAt - deterministic from
// (zone, distance, seed), not a live per-tick chance roll.
export function shouldShowEvent(): EncounterId | undefined {
  const firedIds = new Set<EncounterId>();
  if (firedMask & 2n) firedIds.add('rabbidSquirrel');
  if (firedMask & 4n) firedIds.add('occupiedOuthouse');
  if (firedMask & 1n) firedIds.add('hastilyAbandonedCamp');

  return resolvePoiAt(getCurrentZoneId(), getDistance(), getNumericSeed(), firedIds);
}

// No-op for any non-event monster id.
export function markEventFired(monsterId: string) {
  if (monsterId === 'rabbidSquirrel') firedMask |= 2n;
  if (monsterId === 'hastilyAbandonedCamp') firedMask |= 1n;
  if (monsterId === 'occupiedOuthouse') firedMask |= 4n;
}

export function serializeFiredEvents(): string {
  return firedMask.toString(16);
}

export function hydrateFiredEvents(hex: string) {
  firedMask = hex ? BigInt('0x' + hex) : 0n;
}
