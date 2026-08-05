import type { DialogNode } from '../dialog';

export default {
  'unpromptedCreek:root': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: "The creek cuts across the trail at an angle that suggests it was here first and has strong feelings about the trail's routing. It is not wide. It is not deep. It interrupts anyway, mid-step.",
      },
    ],
    choices: [
      { text: 'Linger a while.', next: 'unpromptedCreek:linger' },
      { text: 'Negotiate the jump.', next: 'unpromptedCreek:jump' },
    ],
  },
  'unpromptedCreek:linger': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'You feel a profound sense of purpose.',
      },
    ],
    choices: [{ text: '...', next: 'unpromptedCreek:lingered' }],
  },
  'unpromptedCreek:lingered': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'You feel a normal sense of purpose.',
      },
    ],
    choices: [{ text: 'Negotiate the jump.', next: 'unpromptedCreek:jump' }],
  },
  'unpromptedCreek:jump': {
    lines: [
      { kind: 'action', effect: 'grantJumpXp' },
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'The jump is short, but you clear it quickly. In fact, a small child would have. You still feel a sense of pride over the execution.',
      },
    ],
  },
} satisfies Record<string, DialogNode>;
