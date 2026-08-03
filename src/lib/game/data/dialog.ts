import type { EffectId } from './effects';
import type { Condition } from './condition';

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
  // Evaluated once when the node renders (see getVisibleDialogChoices() in
  // engine.ts) - a choice that was visible when the conversation started
  // this node can still vanish if you re-enter after the underlying state
  // changes, but it won't flicker mid-node. Absent = always visible.
  when?: Condition;
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
    text: 'It is already staring at you when you notice it — perfectly still, eyes wide, something small and rotten clutched in one paw like leverage. Neither of you moves.',
    choices: [{ text: 'Hold its gaze.', next: 'squirrel:standoff' }],
  },
  'squirrel:standoff': {
    text: "A long silence. Its tail twitches once, calculating. You cannot tell if it is sizing you up or working up the nerve to bolt — possibly both, possibly at you.",
    choices: [{ text: 'Do not blink.', next: 'squirrel:offer' }],
  },
  'squirrel:offer': {
    text: 'It breaks the stare first — or wins it, hard to say — and drops the thing at your feet: an acorn, held too long and too hard. It waits, perfectly still, deciding something about you that you were not consulted on.',
    choices: [
      { text: 'Take it.', next: 'squirrel:yes' },
      { text: 'Leave it be.', next: 'squirrel:no' },
    ],
  },
  'squirrel:yes': {
    text: "You pick it up. The squirrel doesn't relax so much as recalibrate, like you've passed a test whose stakes it hasn't decided yet. It falls in beside you and does not leave — nor, notably, does it stop watching you.",
    effect: 'unlockPet',
  },
  'squirrel:no': {
    text: "You leave it where it fell. The squirrel doesn't move for a long moment, then walks off at an unhurried pace that feels less like disappointment than like it's making a note of something.",
  },

  'genie:root': {
    text: 'The cork pops on its own. Something steps out of the smoke. "One wish," it says. "Try to make it easy on both of us."',
    choices: [
      { text: 'I wish to know what happened to the missing adventurers.', next: 'genie:lore' },
      { text: 'Who are you?', next: 'genie:whoAreYou' },
      { text: 'I want an item.', next: 'genie:item' },
      { text: 'Never mind. Go back in your bottle.', next: 'genie:nevermind' },
      {
        text: 'Give a go-get-em nod to your squirrel.',
        next: 'genie:squirrelNod',
        when: { kind: 'hasFeature', feature: 'pet' },
      },
    ],
  },
  'genie:lore': {
    text: 'The genie\'s smile doesn\'t move, but something behind its eyes does. "They died," it says. "Horribly. Unspeakably. Several different ways, if that helps."',
    choices: [{ text: 'Fine.', next: 'genie:root' }],
  },
  'genie:whoAreYou': {
    text: '"Doug," the genie says. "Used to be a sheep. Some spell ricocheted off its actual target and caught me instead. Next thing I know, I\'m a genie."',
    choices: [{ text: 'Fine.', next: 'genie:root' }],
  },
  'genie:item': {
    text: "The genie exhales, unimpressed at how easy that was — and something lands in your hand before you've even finished asking.",
    effect: 'grantGenieWish',
  },
  'genie:nevermind': {
    text: 'The genie shrugs — not offended, not surprised — and folds itself back into the bottle like it was expecting this all along.',
  },
  'genie:squirrelNod': {
    text: 'The squirrel gestures intently at the genie — a full pantomime, whiskers and all.',
    choices: [{ text: '...', next: 'genie:granted' }],
  },
  'genie:granted': {
    text: '"Granted!" the genie says. "Take care, fellow travelers. Look out for the—" It vanishes mid-sentence, in a small, tidy poof.',
    effect: 'squirrelWish',
  },
} as const satisfies Record<string, DialogNode>;

export type DialogId = keyof typeof DIALOGS;

// DialogNodeId is deliberately wider than DialogId (see above), so indexing
// DIALOGS by one hits "no index signature" - this is the one place that
// swallows the cast, so every caller (engine.ts, SocialCard.svelte) stays
// plain and type-checked on the way in and out.
export function getDialogNode(id: DialogNodeId): DialogNode {
  return (DIALOGS as Record<string, DialogNode>)[id];
}
