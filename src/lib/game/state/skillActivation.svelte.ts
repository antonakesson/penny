import { SKILLS, type SkillId, type Faculty } from '../data/skills';

// Replaces both state/action.svelte.ts's ActionState mutex and the old
// skillCast slice - they were the same state machine written twice, once for
// attack/investigate and once for skills. Now there's one shape and
// SkillDef.occupies decides what can run alongside what.
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

// Was two named slots, exclusive + free. That shape only made sense while
// exclusivity was a boolean - once "what can run alongside what" is a set
// intersection, a fixed pair of slots is a lie about the model. In practice
// this stays tiny: instant skills fire without ever starting an activation,
// so only casts and channels are ever in here.
let activations = $state<Partial<Record<SkillId, ActiveSkill>>>({});
// Per-skill, not one shared timer - independent skills cool down
// independently.
let cooldownEndsAt = $state<Partial<Record<SkillId, number>>>({});

export function getActiveSkill(id: SkillId): ActiveSkill | null {
  return activations[id] ?? null;
}

export function getActivations(): ActiveSkill[] {
  return Object.values(activations).filter((a) => a !== undefined);
}

// What the cast bar draws. Committed work outranks recovery, so a swing
// winding up is never hidden behind something else's cooldown; past that
// it's whatever's first, which is unambiguous today because everything that
// can run concurrently with a cast occupies nothing and is therefore
// instant.
export function getPrimaryActivation(): ActiveSkill | null {
  const all = getActivations();
  return all.find((a) => a.phase !== 'recovering') ?? all[0] ?? null;
}

// Every faculty currently tied up. Recovery deliberately doesn't count - see
// SkillDef.occupies.
export function getHeldFaculties(): Set<Faculty> {
  const held = new Set<Faculty>();
  for (const active of getActivations()) {
    if (active.phase === 'recovering') continue;
    for (const faculty of SKILLS[active.id].occupies) held.add(faculty);
  }
  return held;
}

// Whether starting `id` right now would collide with something already
// running. Re-pressing a skill that's already active counts as a conflict on
// its own terms, which is what the identity check covers - a skill occupying
// nothing still can't be started twice.
export function isBlockedByFaculties(id: SkillId): boolean {
  if (activations[id]) return true;
  const held = getHeldFaculties();
  return SKILLS[id].occupies.some((faculty) => held.has(faculty));
}

// Which faculty is in the way, for anything that wants to say so rather than
// just refuse. null when nothing blocks.
export function getBlockingFaculty(id: SkillId): Faculty | null {
  const held = getHeldFaculties();
  return SKILLS[id].occupies.find((faculty) => held.has(faculty)) ?? null;
}

export function startSkill(id: SkillId, phase: SkillPhase, now: number) {
  activations = { ...activations, [id]: { id, phase, startedAt: now, lastTickAt: now } };
}

export function setSkillPhase(id: SkillId, phase: SkillPhase, now: number) {
  const active = activations[id];
  if (!active) return;
  active.phase = phase;
  active.startedAt = now;
}

export function advanceChannelTick(id: SkillId, tickMs: number) {
  const active = activations[id];
  if (!active) return;
  active.lastTickAt += tickMs;
}

export function clearSkill(id: SkillId) {
  if (!activations[id]) return;
  const next = { ...activations };
  delete next[id];
  activations = next;
}

// Drops whatever's mid-activation against the current encounter, without
// touching cooldowns. Called when the ground moves under an activation - an
// interrupting encounter, a target that just died - so a half-finished swing
// doesn't bleed into whatever comes next. Untargeted skills survive: nothing
// about the encounter changing invalidates them.
export function clearTargetedSkills() {
  const next = { ...activations };
  for (const id of Object.keys(next) as SkillId[]) {
    if (SKILLS[id].requiresTarget) delete next[id];
  }
  activations = next;
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
