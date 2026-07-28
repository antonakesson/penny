// Session-scoped, like action.svelte.ts's swing timer — not persisted. A
// reload mid-freeze losing the remaining charges is an acceptable edge case
// for a short consumable effect, not core progression.
let remaining = $state(0);

export function getSpawnFreezeRemaining(): number {
  return remaining;
}

export function startSpawnFreeze(kills: number) {
  remaining = kills;
}

// Returns true if a freeze charge was consumed - callers use that to decide
// whether to skip advancing distance for this kill.
export function consumeSpawnFreeze(): boolean {
  if (remaining <= 0) return false;
  remaining -= 1;
  return true;
}
