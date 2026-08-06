import type { SkillId } from '../data/skills';

// Attack and Investigate aren't earned - they're what the game has always
// been, now that they're skills like everything else. Everything past them
// comes from the Skill Trainer pane (see Skills.svelte); engine.ts's
// learnSkill() is the gate that actually grants one.
const BASELINE_SKILLS: SkillId[] = ['attack', 'investigate'];

// Permanent once learned, same shape as unlockedFeatures in
// state/features.svelte.ts.
let knownSkills = $state<SkillId[]>([...BASELINE_SKILLS]);

export function isSkillKnown(id: SkillId): boolean {
  return knownSkills.includes(id);
}

export function learnSkill(id: SkillId) {
  if (knownSkills.includes(id)) return;
  knownSkills = [...knownSkills, id];
}

// Read-only whole-list accessor - the status bar needs to render "every
// known skill," not check one specific id the way isFeatureUnlocked()'s
// callers all do, so unlike features.svelte.ts this needs a getAll too.
export function getKnownSkillIds(): readonly SkillId[] {
  return knownSkills;
}

export function serializeSkills(): SkillId[] {
  return knownSkills;
}

// Baselines are unioned back in rather than trusted from the save - a save
// written before attack/investigate were skills has neither, and they're not
// something a player can be missing. Cheaper and more durable than a
// SAVE_VERSION migration for what is really an invariant.
export function hydrateSkills(value: SkillId[]) {
  knownSkills = [...BASELINE_SKILLS, ...value.filter((id) => !BASELINE_SKILLS.includes(id))];
}
