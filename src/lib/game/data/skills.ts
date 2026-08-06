import { EFFECTS, type EffectId } from './effects';
import type { ActionKind } from '../types';

// The three shapes an activation can take. Everything the player does to an
// encounter is one of these - attack is a cast, investigate is a channel,
// and a utility skill like Turn Around is instant. Before this union each
// shape had its own hand-rolled state machine in combatEngine.ts; adding a
// fourth shape now means adding a member here, not another handler.
export type SkillTiming =
  // Fires the moment it's pressed.
  | { kind: 'instant' }
  // Winds up for castTimeMs, then fires once. Interrupted by anything that
  // clears the slot (encounter death, an interrupting encounter).
  | { kind: 'cast'; castTimeMs: number }
  // Fires every tickMs for as long as it's held. Release stops it.
  | { kind: 'channel'; tickMs: number };

export type SkillDef = {
  name: string;
  // Voice #2 (item-flavor) register - dry, mechanical, sincere. Mandatory
  // here (ItemDef.flavor is optional) since a skill row has nothing else
  // on it to explain what pressing it does.
  description: string;
  timing: SkillTiming;
  // Time after the effect fires before this skill can be used again.
  cooldownMs: number;
  // Two things at once, because for every skill that has one they're the
  // same thing: an exclusive skill occupies the single action slot (you
  // can't attack and investigate at once), AND it's only usable against an
  // encounter whose own `action` field names it. That's what makes
  // ActionKind a subset of SkillId below - an encounter picks its combat
  // skill by id. A non-exclusive skill has no target and fires whenever,
  // which is what lets Turn Around go off mid-swing without pausing the
  // fight. Split the two apart when a skill actually needs one without the
  // other, not before.
  exclusive: boolean;
  // Same shape as ItemDef.action.effect in loot.ts - a skill fires through
  // the exact same triggerEffect() pipe an item does, no separate
  // mechanism. No `consumes` counterpart - skills aren't held inventory;
  // whether one is known at all is state/skill.svelte.ts's job, not this
  // registry's.
  action: { effect: EffectId | readonly EffectId[] };
};

// What level grants which skill lives in data/skillGrants.ts, not here -
// this registry is only what a skill IS/does, never when you get it (that's
// progression-pacing content, a different concern).
export const SKILLS = {
  // Baseline. These numbers were config.ts's ACTION.activeMs/cooldownMs back
  // when attack was a hand-rolled handler - a 1.5s windup landing one scaled
  // hit, then 400ms of recovery.
  attack: {
    name: 'Attack',
    description: 'Swings at whatever is in front of you. Slowly.',
    timing: { kind: 'cast', castTimeMs: 1500 },
    cooldownMs: 400,
    exclusive: true,
    action: { effect: 'strike' },
  },
  // Baseline. 1 damage every 250ms is the 4 dps config.ts's INVESTIGATE knob
  // used to name - the old carry math dribbled out whole points at exactly
  // this interval anyway, so a discrete tick is the same drain without the
  // remainder bookkeeping.
  investigate: {
    name: 'Investigate',
    description: 'Rummages through something, for as long as you keep at it.',
    timing: { kind: 'channel', tickMs: 250 },
    cooldownMs: 0,
    exclusive: true,
    action: { effect: 'sift' },
  },
  turnAround: {
    name: 'Turn Around',
    // Describes the one-shot action only - which way that leaves you
    // facing is map.svelte.ts's returning flag, not this skill's business
    // (see MiniMap.svelte for where that actually surfaces).
    description: 'Reverses whichever direction you happen to be walking.',
    timing: { kind: 'instant' },
    cooldownMs: 2000,
    exclusive: false,
    action: { effect: 'toggleDirection' },
  },
} as const satisfies Record<string, SkillDef>;

export type SkillId = keyof typeof SKILLS;

// Compile-time proof that every encounter action kind names a real skill.
// Add an hp-drain encounter kind to types.ts without a skill to fight it
// with and this is the line that fails.
const _actionKindsAreSkills: ActionKind extends SkillId ? true : never = true;
void _actionKindsAreSkills;

export function getSkillEffects(id: SkillId): readonly EffectId[] {
  const { effect } = SKILLS[id].action;
  return Array.isArray(effect) ? effect : [effect as EffectId];
}

// Damage per second a channel skill sustains. data/entities.ts authors an
// investigation's length as an honest durationMs, and encounter.svelte.ts
// turns that into an hp number against this - so the skill def stays the
// single source of truth for how fast a channel drains, instead of a config
// knob that has to be kept in agreement with it.
export function channelDps(id: SkillId): number {
  const { timing } = SKILLS[id];
  if (timing.kind !== 'channel') return 0;
  return getSkillEffects(id).reduce((dps, effectId) => {
    const def = EFFECTS[effectId];
    if (def.kind !== 'damageEncounter' || typeof def.amount !== 'number') return dps;
    return dps + def.amount * (1000 / timing.tickMs);
  }, 0);
}
