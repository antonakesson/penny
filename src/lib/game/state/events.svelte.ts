// Opaque on purpose: fired state is a bitmask, not named ids, so the save
// file never leaks which one-shot story beats exist or have fired (see
// bestiary.svelte.ts's discoveredMask for the same trick). Deliberately
// hardcoded rather than a declarative condition schema for now — with a
// single event there's nothing to generalize yet, and a "DSL" here would
// need compound boolean logic, arithmetic, RNG, and cross-event
// sequencing almost immediately, which is exactly the "ugly in-between of
// declarative config and code" that killed the previous event system.
// Revisit only once a few more hardcoded events reveal real repetition.
import { getDistance } from './map.svelte';
import { rollDistanceChance } from '../util/weighted';
import type { MonsterId } from '../data/monstats';

let firedMask = $state<bigint>(0n);

// Pure check - which event (if any) should show right now. Does NOT mark
// anything fired; that only happens once the resulting encounter is
// actually killed (see markEventFired), so a roll that never resolves
// (e.g. a throwaway speculative encounter discarded by hydration) can't
// permanently burn a one-shot event nobody ever saw.
export function shouldShowEvent(): MonsterId | undefined {
  const hastilyAbandonedCampFired = (firedMask & 1n) !== 0n;
  if (!hastilyAbandonedCampFired && rollDistanceChance(50, 100, getDistance())) {
    return 'hastilyAbandonedCamp';
  }

  return undefined;
}

// Called from resolveKill() once an event encounter is actually completed -
// a no-op for any non-event monster id.
export function markEventFired(monsterId: string) {
  if (monsterId === 'hastilyAbandonedCamp') firedMask |= 1n;
}

export function serializeFiredEvents(): string {
  return firedMask.toString(16);
}

export function hydrateFiredEvents(hex: string) {
  firedMask = hex ? BigInt('0x' + hex) : 0n;
}
