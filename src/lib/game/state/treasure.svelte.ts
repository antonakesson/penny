export interface TreasureRuntime {
  startedAt: number | null;
  status: 'active' | 'resolved';
  resolvedAt: number | null;
}

let current = $state<TreasureRuntime>({ startedAt: null, status: 'active', resolvedAt: null });

export function getTreasureRuntime(): TreasureRuntime {
  return current;
}

export function resetTreasure() {
  current = { startedAt: null, status: 'active', resolvedAt: null };
}

export function startInvestigating() {
  if (current.status === 'active' && current.startedAt === null) current.startedAt = Date.now();
}

// Loot/xp awarding is cross-slice composition and stays in engine.ts — this
// only flips this slice's own status, same as monster.svelte.ts's
// killMonster() never awards loot itself either.
export function resolveTreasure() {
  current.status = 'resolved';
  current.resolvedAt = Date.now();
}

export function serializeTreasure(): TreasureRuntime {
  return current;
}

export function hydrateTreasure(snapshot: TreasureRuntime) {
  current = snapshot;
}
