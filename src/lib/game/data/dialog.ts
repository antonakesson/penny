import type { EffectId } from './effects';
import type { Condition } from './condition';

// Plain string, not keyof typeof DIALOGS - that would make DIALOGS
// self-referential (a node's `next` pointing at a sibling key of the object
// it's declared inside), which TS can't express. Typo'd `next` surfaces at
// runtime, not compile time.
export type DialogNodeId = string;

export interface DialogChoice {
  text: string;
  next: DialogNodeId;
  // Evaluated once when the node renders - won't flicker mid-node even if
  // the underlying state changes. Absent = always visible.
  when?: Condition;
}

// No choices = dead end, conversation ends there. `effect` fires the
// moment this node is reached, whether or not it's also terminal.
export interface DialogNode {
  text: string;
  choices?: readonly DialogChoice[];
  effect?: EffectId;
}

// Flat table - node ids prefixed with their dialog's name (`squirrel:greet`)
// rather than nesting per-dialog objects.
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

  'outhouse:root': {
    text: 'The outhouse door is shut, bolt turned to OCCUPIED — laminated, as if this exact situation has come up before and someone finally did something about it. Something inside is very deliberately making no sound at all.',
    choices: [
      { text: 'Knock.', next: 'outhouse:knock' },
      { text: 'Wait.', next: 'outhouse:wait' },
      { text: 'The lamination is not legally binding.', next: 'outhouse:enter' },
    ],
  },
  'outhouse:knock': {
    text: '"Occupied," says a voice. A pause, then, unprompted: "There is a queue." There is not, audibly, a queue. There has never, audibly, been a queue.',
    choices: [
      { text: 'Wait.', next: 'outhouse:wait' },
      { text: 'The lamination is not legally binding.', next: 'outhouse:enter' },
    ],
  },
  'outhouse:wait': {
    text: 'You join the queue that does not exist, notionally first in line for it. Minutes pass with the settled confidence of someone who has budgeted for this. You did not budget for this.',
    choices: [
      { text: 'A little longer.', next: 'outhouse:waitLonger' },
      { text: 'You cannot wait a little longer.', next: 'outhouse:accident' },
    ],
  },
  'outhouse:waitLonger': {
    text: 'You are still queued. The sign has not turned, has not been asked to turn, and gives every indication that turning is somebody else\'s department.',
    choices: [
      { text: 'One more minute.', next: 'outhouse:accident' },
      { text: 'Enough of this.', next: 'outhouse:enter' },
    ],
  },
  'outhouse:accident': {
    text: 'The queue was never going to call your number. You stop waiting for it. Best not to elaborate further.',
  },
  'outhouse:enter': {
    text: 'The lamination, it turns out, was never load-bearing. The occupant has Strong Opinions, several beginning with "someone is going to hear about this." None of them slow you down. Somebody is, in fact, about to write a letter. It will not reach you either.',
  },
} as const satisfies Record<string, DialogNode>;

export type DialogId = keyof typeof DIALOGS;

// DialogNodeId is wider than DialogId, so indexing DIALOGS by one hits "no
// index signature" - this is the one place that swallows the cast.
export function getDialogNode(id: DialogNodeId): DialogNode {
  return (DIALOGS as Record<string, DialogNode>)[id];
}
