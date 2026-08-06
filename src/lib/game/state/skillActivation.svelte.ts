import { SKILLS, type SkillId } from '../data/skills';

// Replaces both state/action.svelte.ts's ActionState mutex and the old
// skillCast slice - they were the same state machine written twice, once for
// attack/investigate and once for skills. Now there's one shape and
// SkillDef.exclusive decides which slot an activation lands in.
export type SkillPhase = 'casting' | 'channeling' | 'recovering';

export interface ActiveSkill {
  id: SkillId;
  phase: SkillPhase;
  startedAt: number;
  // Only meaningful while channeling - when the last tick fired. Advanced by
  // exactly tickMs per tick rather than reset to `now`, so a slow frame
  // catches up instead of silently dropping the remainder (the fractional
  // carry the old investigate math needed a running remainder to preserve).
  lastTickAt: number;
}

// Two slots, not a map keyed by id: an exclusive activation is the one thing
// the player is doing to the encounter in front of them, and everything else
// is a utility skill going off alongside it. Nothing yet needs two utility
// skills mid-cast at once, so the second slot stays singular until something
// does.
let exclusive = $state<ActiveSkill | null>(null);
let free = $state<ActiveSkill | null>(null);
// Per-skill, not one shared timer - independent skills cool down
// independently.
let cooldownEndsAt = $state<Partial<Record<SkillId, number>>>({});

function slotFor(id: SkillId): 'exclusive' | 'free' {
  return SKILLS[id].exclusive ? 'exclusive' : 'free';
}

// The exclusive slot specifically - this is what the attack/investigate
// meters draw, and what "am I mid-swing" means everywhere else.
export function getExclusiveSkill(): ActiveSkill | null {
  return exclusive;
}

// The utility slot. Only engine.ts's tick reads this - it needs to advance
// whatever's in it without knowing which skill that is.
export function getFreeSkill(): ActiveSkill | null {
  return free;
}

export function getActiveSkill(id: SkillId): ActiveSkill | null {
  const slot = slotFor(id) === 'exclusive' ? exclusive : free;
  return slot?.id === id ? slot : null;
}

// Whether a new activation of `id` would have to wait for the slot it wants.
// A busy exclusive slot never blocks a utility skill, and vice versa.
export function isSlotBusy(id: SkillId): boolean {
  return (slotFor(id) === 'exclusive' ? exclusive : free) !== null;
}

export function startSkill(id: SkillId, phase: SkillPhase, now: number) {
  const entry: ActiveSkill = { id, phase, startedAt: now, lastTickAt: now };
  if (slotFor(id) === 'exclusive') exclusive = entry;
  else free = entry;
}

export function setSkillPhase(id: SkillId, phase: SkillPhase, now: number) {
  const active = getActiveSkill(id);
  if (!active) return;
  active.phase = phase;
  active.startedAt = now;
}

export function advanceChannelTick(id: SkillId, tickMs: number) {
  const active = getActiveSkill(id);
  if (!active) return;
  active.lastTickAt += tickMs;
}

export function clearSkill(id: SkillId) {
  if (slotFor(id) === 'exclusive') {
    if (exclusive?.id === id) exclusive = null;
  } else if (free?.id === id) {
    free = null;
  }
}

// Drops whatever's mid-activation against the current encounter, without
// touching cooldowns. Called when the ground moves under an activation - an
// interrupting encounter, a target that just died - so a half-finished swing
// doesn't bleed into whatever comes next.
export function clearExclusiveSkill() {
  exclusive = null;
}

export function setCooldown(id: SkillId, endsAt: number) {
  cooldownEndsAt = { ...cooldownEndsAt, [id]: endsAt };
}

// Pure snapshot, no time math - callers compare it against their own clock
// so the UI's countdown re-renders off its own poll (see Character.svelte's
// activeEffects for the same shape) rather than this getter needing to be
// called every frame to stay live.
export function getCooldownEndsAt(id: SkillId): number | undefined {
  return cooldownEndsAt[id];
}
