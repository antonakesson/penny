import type { EffectId } from './effects';

// Loosely typed like ENCOUNTERS' dropTableId: readonly string[] — node ids
// aren't cross-checked against DIALOGS' own keys at the type level. Keeping
// DialogNodeId as keyof typeof DIALOGS would make DIALOGS's own type
// self-referential (a node's `next` pointing at a sibling key of the object
// it's declared inside), which TS can't express without pain far out of
// proportion to what this buys. Authoring mistakes (typo'd `next`) surface
// at runtime instead of compile time — acceptable for now, revisit if it
// ever bites.
export type DialogNodeId = string;

export interface DialogChoice {
  text: string;
  next: DialogNodeId;
}

// A node with no choices (or an empty array) is a dead end — the
// conversation ends there. `effect` fires (via triggerEffect(), same table
// an item's action binding reads from — see EFFECTS) the moment this node is
// reached, whether or not it's also terminal.
export interface DialogNode {
  text: string;
  choices?: readonly DialogChoice[];
  effect?: EffectId;
}

// Flat table, one namespace for every dialog in the game — same shape as
// ENCOUNTERS/EFFECTS. Collisions are still caught: TS errors (ts1117) on
// duplicate keys within a single object literal, so the only real job left
// is picking unique ids. Convention: prefix every node with its dialog's
// name (`squirrel:greet`) rather than nesting per-dialog objects — nesting
// buys nothing extra here and costs an indent level + a `.nodes.` hop on
// every reference.
export const DIALOGS = {
  'squirrel:greet': {
    text: 'The squirrel sits up on its haunches, clutching something small and fuzzed with mold. It looks at you, then at the thing, then back at you. Will this work?',
    choices: [
      { text: 'Take it.', next: 'squirrel:yes' },
      { text: "Leave it be.", next: 'squirrel:no' },
    ],
  },
  'squirrel:yes': {
    text: "The squirrel drops the acorn into your palm and doesn't scamper off. It just watches you, waiting to see what you do next.",
    effect: 'unlockPet',
  },
  'squirrel:no': {
    text: 'The squirrel lowers the acorn slowly. It walks away, glancing back every few steps, like it expected better of you.',
  },
} as const satisfies Record<string, DialogNode>;

export type DialogId = keyof typeof DIALOGS;
