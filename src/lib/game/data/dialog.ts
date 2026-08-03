import type { EffectId } from './effects';
import type { Condition } from './condition';
import type { CharacterId } from './characters';

// Plain string, not keyof typeof DIALOGS - that would make DIALOGS
// self-referential (a node's `next` pointing at a sibling key of the object
// it's declared inside), which TS can't express. Typo'd `next` surfaces at
// runtime, not compile time.
export type DialogNodeId = string;

export type Speaker = CharacterId | 'narrator';

// Tagged union, not one line-object with optional fields - adding a future
// capability (e.g. a sound cue) is a new tag, and none of the content
// authored under the existing tags needs to be reshaped to make room for it.
//
// 'say' is the only kind that renders - 'action'/'rename' are silent,
// processed once when the node is reached (see resolveDialogChoice() in
// engine.ts). All lines of a node are shown at once (no line-by-line
// reveal), so ordering only matters as "which effects/renames land before
// this node's say lines are read," not as a timed sequence.
export type DialogLine =
  | { kind: 'say'; speaker: Speaker; text: string }
  // Fires a real EFFECTS entry - the per-line counterpart of the old
  // node-level `effect` field, freeing it to land between lines instead of
  // only on node arrival.
  | { kind: 'action'; effect: EffectId }
  // Overrides a character's display name for the rest of the encounter
  // (or until the next rename) - see CHARACTERS in characters.ts for the
  // default it overrides.
  | { kind: 'rename'; character: CharacterId; name: string };

export interface DialogChoice {
  text: string;
  next: DialogNodeId;
  // Evaluated once when the node renders - won't flicker mid-node even if
  // the underlying state changes. Absent = always visible.
  when?: Condition;
}

// No choices = dead end, conversation ends there.
export interface DialogNode {
  lines: readonly DialogLine[];
  choices?: readonly DialogChoice[];
}

// One file per dialog tree under ./dialog/, each default-exporting its own
// node map (see dialog/genie.ts for the shape) - glob-loaded so adding a new
// encounter's dialog is just a new file, no import list to maintain here.
const modules = import.meta.glob<{ default: Record<string, DialogNode> }>('./dialog/*.ts', { eager: true });

export const DIALOGS: Record<string, DialogNode> = Object.assign(
  {},
  ...Object.values(modules).map((module) => module.default),
);

export type DialogId = keyof typeof DIALOGS;

export function getDialogNode(id: DialogNodeId): DialogNode {
  return DIALOGS[id];
}
