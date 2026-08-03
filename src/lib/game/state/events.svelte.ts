// Opaque on purpose: fired state is a bitmask, not named ids, so the save
// file never leaks which one-shot story beats exist or have fired.
// Deliberately
// hardcoded rather than a declarative condition schema for now — two
// events (both a single ramped distance check) still isn't enough to
// justify generalizing, and a "DSL" here would need compound boolean
// logic, arithmetic, RNG, and cross-event sequencing almost immediately,
// which is exactly the "ugly in-between of declarative config and code"
// that killed the previous event system. Revisit once a few more
// hardcoded events reveal real repetition. Bit assignments are fixed once
// used (not reassigned/reordered) - a saved firedMask is only meaningful
// against the bit layout that wrote it.
import { getDistance } from './map.svelte';
import { rollDistanceChance } from '../util/weighted';
import type { EncounterId } from '../data/encounters';

let firedMask = $state<bigint>(0n);

// Pure check - which event (if any) should show right now. Does NOT mark
// anything fired; that only happens once the resulting encounter is
// actually killed (see markEventFired), so a roll that never resolves
// (e.g. a throwaway speculative encounter discarded by hydration) can't
// permanently burn a one-shot event nobody ever saw.
export function shouldShowEvent(): EncounterId | undefined {
  const rabbidSquirrelFired = (firedMask & 2n) !== 0n;
  if (!rabbidSquirrelFired && rollDistanceChance(10, 25, getDistance())) {
    return 'rabbidSquirrel';
  }

  const hastilyAbandonedCampFired = (firedMask & 1n) !== 0n;
  if (!hastilyAbandonedCampFired && rollDistanceChance(50, 100, getDistance())) {
    return 'hastilyAbandonedCamp';
  }

  return undefined;
}

// Called from resolveKill()/resolveDialogChoice() once an event encounter is
// actually completed - a no-op for any non-event monster id.
export function markEventFired(monsterId: string) {
  if (monsterId === 'rabbidSquirrel') firedMask |= 2n;
  if (monsterId === 'hastilyAbandonedCamp') firedMask |= 1n;
}

export function serializeFiredEvents(): string {
  return firedMask.toString(16);
}

export function hydrateFiredEvents(hex: string) {
  firedMask = hex ? BigInt('0x' + hex) : 0n;
}
