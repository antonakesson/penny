import { SKILLS, type SkillId } from '../game/data/skills';

// Rhythm input lives on the keyboard so the mouse can stay a decision
// instrument. Dialog choices deliberately have NO keyboard binding and
// shouldn't get one: number keys over a choice list is exactly how a
// rhythm press ends up picking a conversation option for you.
export const ACTION_KEY = ' ';
export const ACTION_KEY_LABEL = 'Space';

// Positional over learn order, not a stored assignment - the first utility
// skill you learn is Q, the next is W, and so on. Learn order is already
// stable and already persisted, so there's nothing here to serialize,
// migrate, or build an assignment screen for. If utility skills ever
// outgrow this row, that's the moment to add real rebinding - by then
// there'll be actual play to base it on.
export const UTILITY_KEYS = ['q', 'w', 'e', 'r', 't'] as const;

// Exclusive skills never take a utility slot - the encounter in front of you
// decides which one of those you're using, so they all answer to ACTION_KEY
// instead. SkillDef.exclusive does that filtering for free.
function utilitySkillIds(known: readonly SkillId[]): SkillId[] {
  return known.filter((id) => !SKILLS[id].exclusive);
}

export function skillForKey(key: string, known: readonly SkillId[]): SkillId | null {
  const slot = (UTILITY_KEYS as readonly string[]).indexOf(key);
  if (slot === -1) return null;
  return utilitySkillIds(known)[slot] ?? null;
}

// What the Skills pane prints on a row, so the binding is visible rather
// than folklore. null for a utility skill past the end of the key row.
export function hotkeyLabelFor(id: SkillId, known: readonly SkillId[]): string | null {
  if (SKILLS[id].exclusive) return ACTION_KEY_LABEL;
  const slot = utilitySkillIds(known).indexOf(id);
  if (slot === -1 || slot >= UTILITY_KEYS.length) return null;
  return UTILITY_KEYS[slot].toUpperCase();
}
