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

// What a skill ties up while it runs. Two skills collide if their sets
// intersect, and that one rule is the whole mutex - "you can't attack and
// investigate at once" isn't written anywhere, it falls out of both taking
// `hands`. Grow this enum when a shipped skill needs a distinction it can't
// currently express, not in advance: an unused faculty blocks nothing and
// reads as a promise the game doesn't keep.
export const FACULTIES = ['hands', 'focus'] as const;
export type Faculty = (typeof FACULTIES)[number];

export type SkillDef = {
  name: string;
  // Voice #2 (item-flavor) register - dry, mechanical, sincere. Mandatory
  // here (ItemDef.flavor is optional) since a skill row has nothing else
  // on it to explain what pressing it does.
  description: string;
  // Present participle the cast bar prints while this is running - "Digging
  // through it…" rather than "Investigate…". Optional; falls back to the
  // name, which is the right read for a skill with nothing more specific to
  // say. Only the running phase gets one: recovery and cooldown are the same
  // beat whatever produced them.
  verb?: string;
  timing: SkillTiming;
  // Time after the effect fires before this skill can be used again.
  cooldownMs: number;
  // Which faculties this ties up while casting or channelling. The empty set
  // is a real and useful answer - a skill that occupies nothing is gated
  // only by its own cooldown, and is the only thing that can go off during
  // someone else's cast. Recovery holds nothing: it's a cooldown parked in
  // the activation, not continued effort, and blocking on it would starve
  // utility skills out of combat entirely.
  occupies: readonly Faculty[];
  // Whether this skill needs the encounter in front of you to name it. Was
  // half of the old `exclusive` flag, which conflated targeting with the
  // action-slot mutex; faculties took the mutex half, so what's left here is
  // only "does this have a target". Still what makes ActionKind a subset of
  // SkillId below - an encounter picks its combat skill by id.
  requiresTarget: boolean;
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
    verb: 'Swinging',
    timing: { kind: 'cast', castTimeMs: 1500 },
    cooldownMs: 400,
    // The whole set, spelled out rather than an 'all' sentinel: a faculty
    // added to FACULTIES later is claimed by a full-body swing automatically,
    // and a skill that wants everything-but-one can still say so.
    occupies: FACULTIES,
    requiresTarget: true,
    action: { effect: 'strike' },
  },
  // Baseline. 1 damage every 250ms is the 4 dps config.ts's INVESTIGATE knob
  // used to name - the old carry math dribbled out whole points at exactly
  // this interval anyway, so a discrete tick is the same drain without the
  // remainder bookkeeping.
  investigate: {
    name: 'Investigate',
    description: 'Rummages through something, for as long as you keep at it.',
    verb: 'Digging through it',
    timing: { kind: 'channel', tickMs: 250 },
    cooldownMs: 0,
    occupies: FACULTIES,
    requiresTarget: true,
    action: { effect: 'sift' },
  },
  turnAround: {
    name: 'Turn Around',
    // Describes the one-shot action only - which way that leaves you
    // facing is map.svelte.ts's returning flag, not this skill's business
    // (see SignalTrace.svelte for where that actually surfaces).
    description: 'Reverses whichever direction you happen to be walking.',
    verb: 'Turning around',
    // A second, because that is roughly how long turning around takes. No
    // cooldown: nothing about having turned should stop you turning again,
    // and the second spent facing neither way is cost enough on its own.
    timing: { kind: 'cast', castTimeMs: 1000 },
    cooldownMs: 0,
    // Your hands are free while you turn; your attention isn't. Which is
    // what stops this going off mid-swing, since a swing takes both.
    occupies: ['focus'],
    requiresTarget: false,
    action: { effect: 'toggleDirection' },
  },
} as const satisfies Record<string, SkillDef>;

export type SkillId = keyof typeof SKILLS;

// Compile-time proof that every encounter action kind names a real skill.
// Add an hp-drain encounter kind to types.ts without a skill to fight it
// with and this is the line that fails.
const _actionKindsAreSkills: ActionKind extends SkillId ? true : never = true;
void _actionKindsAreSkills;

// The registry is `as const`, so reading .timing off it hands back only the
// shapes the current roster happens to use - with no instant skill in the
// list, `instant` stops being part of the type and any switch handling it
// breaks. This returns the declared union instead, so callers stay written
// against every timing shape rather than today's inhabitants.
export function getSkillTiming(id: SkillId): SkillTiming {
  return SKILLS[id].timing;
}

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
