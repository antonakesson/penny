import type { SkillId } from './skills';

// What level grants which skill - deliberately kept out of skills.ts's
// SkillDef. A SkillDef describes what a skill IS/does; this describes WHEN
// you get it, which is progression-pacing content (see the level-gated
// pacing design note), not a property of the skill itself.
//
// Even levels only, by design - joke-tier skills land early, while the
// game still reads as simple.
export const SKILL_GRANTS: Record<SkillId, number> = {
  // Baselines - known from level 1, never trained (see BASELINE_SKILLS in
  // state/skill.svelte.ts). Listed anyway so the record stays exhaustive and
  // the trainer can show them as the bottom of the ladder.
  attack: 1,
  investigate: 1,
  turnAround: 2,
};
