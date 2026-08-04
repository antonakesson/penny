import type { DialogNode } from '../dialog';

export default {
  'genie:root': {
    lines: [
      { kind: 'say', speaker: 'narrator', text: 'The cork pops on its own. Something steps out of the smoke.' },
      { kind: 'say', speaker: 'genie', text: 'One wish. Try to make it easy on both of us.' },
    ],
    choices: [
      { text: 'I wish to know what happened to the missing adventurers.', next: 'genie:lore' },
      { text: 'Who are you?', next: 'genie:whoAreYou', uniqueId: 'whoAreYou' },
      { text: 'I want an item.', next: 'genie:item' },
      { text: 'Never mind. Go back in your bottle.', next: 'genie:nevermind' },
      {
        text: 'Give a go-get-em nod to your squirrel.',
        next: 'genie:squirrelNod',
        when: { kind: 'hasFeature', feature: 'pet' },
      },
    ],
  },
  // Terminal, not a loop back to genie:root - "I wish to know" on the
  // choice that leads here is phrased as spending the wish, so it does:
  // no follow-up choices, and 'genie:lore' is wired into FLAG_TRIGGERS
  // (journalFlags.ts) to set genieWishGranted same as genie:item.
  'genie:lore': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: "The genie's smile doesn't move, but something behind its eyes does.",
      },
      { kind: 'say', speaker: 'genie', text: 'They died. Horribly. Unspeakably. Several different ways, if that helps.' },
      { kind: 'action', effect: 'spendGenieWish' },
      {
        kind: 'say',
        speaker: 'narrator',
        text: "It doesn't wait to be dismissed. Wish spent, it folds back into the bottle.",
      },
    ],
  },
  'genie:whoAreYou': {
    lines: [
      { kind: 'rename', character: 'genie', name: 'Doug' },
      {
        kind: 'say',
        speaker: 'genie',
        text: "Doug. Used to be a sheep. Some spell ricocheted off its actual target and caught me instead. Next thing I know, I'm a genie.",
      },
    ],
    choices: [{ text: 'Fine.', next: 'genie:root' }],
  },
  'genie:item': {
    lines: [
      { kind: 'action', effect: 'grantGenieWish' },
      { kind: 'action', effect: 'spendGenieWish' },
      {
        kind: 'say',
        speaker: 'narrator',
        text: "The genie exhales, unimpressed at how easy that was — and something lands in your hand before you've even finished asking.",
      },
    ],
  },
  'genie:nevermind': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'The genie shrugs — not offended, not surprised — and folds itself back into the bottle like it was expecting this all along.',
      },
    ],
  },
  'genie:squirrelNod': {
    lines: [
      { kind: 'say', speaker: 'narrator', text: 'The squirrel gestures intently at the genie — a full pantomime, whiskers and all.' },
    ],
    choices: [{ text: '...', next: 'genie:granted' }],
  },
  'genie:granted': {
    lines: [
      { kind: 'say', speaker: 'genie', text: 'Granted! Take care, fellow travelers. Look out for the—' },
      { kind: 'action', effect: 'squirrelWish' },
      { kind: 'action', effect: 'spendGenieWish' },
      { kind: 'say', speaker: 'narrator', text: 'It vanishes mid-sentence, in a small, tidy poof.' },
    ],
  },
} satisfies Record<string, DialogNode>;
