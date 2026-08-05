import type { DialogNode } from '../dialog';

export default {
  'indifferentBog:root': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: "The trail simply stops being trail and starts being bog, with no fanfare and no clear line between the two. It does not block the way. It does not need to. It will still be here when you're done deciding.",
      },
    ],
    choices: [
      { text: 'Linger a while.', next: 'indifferentBog:linger' },
      { text: 'Wade across.', next: 'indifferentBog:wade' },
    ],
  },
  'indifferentBog:linger': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'You feel no particular sense of purpose. You do, however, sink.',
      },
    ],
    choices: [{ text: '...', next: 'indifferentBog:lingered' }],
  },
  'indifferentBog:lingered': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'The mud has reached your ankles. It is in no hurry, and neither, it turns out, are you.',
      },
    ],
    choices: [{ text: 'Wade across.', next: 'indifferentBog:wade' }],
  },
  'indifferentBog:wade': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'You wade across. The bog offers no resistance and keeps no record of you. You feel nothing in particular about the crossing, which is at least an improvement.',
      },
    ],
  },
} satisfies Record<string, DialogNode>;
