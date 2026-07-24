export interface RecruitRuntime {
  stageIndex: number;
  status: 'active' | 'resolved';
  resolvedAt: number | null;
  // 'timer' stages:
  stageStartedAt: number | null;
  // 'hold' stages: heldMs accumulates while isHolding, decays while not;
  // lastTickAt is the previous tick's timestamp, for computing the delta.
  heldMs: number;
  isHolding: boolean;
  lastTickAt: number | null;
}

function freshRuntime(): RecruitRuntime {
  return { stageIndex: 0, status: 'active', resolvedAt: null, stageStartedAt: null, heldMs: 0, isHolding: false, lastTickAt: null };
}

let current = $state<RecruitRuntime>(freshRuntime());

export function getRecruitRuntime(): RecruitRuntime {
  return current;
}

export function resetRecruitEvent() {
  current = freshRuntime();
}

export function startStage() {
  if (current.status === 'active' && current.stageStartedAt === null) current.stageStartedAt = Date.now();
}

export function setHolding(holding: boolean) {
  current.isHolding = holding;
}

export function setHeldMs(ms: number) {
  current.heldMs = ms;
}

export function setLastTickAt(ts: number | null) {
  current.lastTickAt = ts;
}

export function advanceStage() {
  current.stageIndex += 1;
  current.stageStartedAt = null;
  current.heldMs = 0;
  current.isHolding = false;
  current.lastTickAt = null;
}

// Granting the mercenary is cross-slice composition and stays in engine.ts —
// this only flips this slice's own status.
export function resolveRecruitEvent() {
  current.status = 'resolved';
  current.resolvedAt = Date.now();
}

export function serializeRecruitEvent(): RecruitRuntime {
  return current;
}

export function hydrateRecruitEvent(snapshot: RecruitRuntime) {
  current = snapshot;
}
