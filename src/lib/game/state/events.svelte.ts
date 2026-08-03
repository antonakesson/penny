// Fired state is a bitmask, not named ids, so the save file never leaks
// which one-shot story beats exist or have fired. Bit assignments are fixed
// once used - a saved firedMask is only meaningful against the layout that
// wrote it.
import { getDistance } from './map.svelte';
import { rollDistanceChance } from '../util/weighted';
import type { EncounterId } from '../data/encounters';

let firedMask = $state<bigint>(0n);

// Pure check - does NOT mark anything fired. That only happens once the
// resulting encounter is actually killed (see markEventFired), so a roll
// that never resolves can't permanently burn a one-shot event unseen.
export function shouldShowEvent(): EncounterId | undefined {
  const rabbidSquirrelFired = (firedMask & 2n) !== 0n;
  if (!rabbidSquirrelFired && rollDistanceChance(10, 25, getDistance())) {
    return 'rabbidSquirrel';
  }

  const occupiedOuthouseFired = (firedMask & 4n) !== 0n;
  if (!occupiedOuthouseFired && rollDistanceChance(20, 40, getDistance())) {
    return 'occupiedOuthouse';
  }

  const hastilyAbandonedCampFired = (firedMask & 1n) !== 0n;
  if (!hastilyAbandonedCampFired && rollDistanceChance(50, 100, getDistance())) {
    return 'hastilyAbandonedCamp';
  }

  return undefined;
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
