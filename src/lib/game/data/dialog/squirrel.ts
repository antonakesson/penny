import type { DialogNode } from '../dialog';

export default {
  'squirrel:greet': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'It is already staring at you when you notice it — perfectly still, eyes wide, something small and rotten clutched in one paw like leverage. Neither of you moves.',
      },
    ],
    choices: [{ text: 'Hold its gaze.', next: 'squirrel:standoff' }],
  },
  'squirrel:standoff': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'A long silence. Its tail twitches once, calculating. You cannot tell if it is sizing you up or working up the nerve to bolt — possibly both, possibly at you.',
      },
    ],
    choices: [{ text: 'Do not blink.', next: 'squirrel:offer' }],
  },
  'squirrel:offer': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'It breaks the stare first — or wins it, hard to say — and drops the thing at your feet: an acorn, held too long and too hard. It waits, perfectly still, deciding something about you that you were not consulted on.',
      },
    ],
    choices: [
      { text: 'Take it.', next: 'squirrel:yes' },
      { text: 'Leave it be.', next: 'squirrel:no' },
    ],
  },
  'squirrel:yes': {
    lines: [
      { kind: 'action', effect: 'unlockPet' },
      {
        kind: 'say',
        speaker: 'narrator',
        text: "You pick it up. The squirrel doesn't relax so much as recalibrate, like you've passed a test whose stakes it hasn't decided yet. It falls in beside you and does not leave — nor, notably, does it stop watching you.",
      },
    ],
  },
  'squirrel:no': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: "You leave it where it fell. The squirrel doesn't move for a long moment, then walks off at an unhurried pace that feels less like disappointment than like it's making a note of something.",
      },
    ],
  },
} satisfies Record<string, DialogNode>;
