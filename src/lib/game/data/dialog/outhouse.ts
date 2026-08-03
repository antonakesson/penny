import type { DialogNode } from '../dialog';

export default {
  'outhouse:root': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'The outhouse door is shut, bolt turned to OCCUPIED — laminated, as if this exact situation has come up before and someone finally did something about it. Something inside is very deliberately making no sound at all.',
      },
    ],
    choices: [
      { text: 'Knock.', next: 'outhouse:knock' },
      { text: 'Wait.', next: 'outhouse:wait' },
      { text: 'The lamination is not legally binding.', next: 'outhouse:enter' },
    ],
  },
  'outhouse:knock': {
    lines: [
      { kind: 'say', speaker: 'occupant', text: 'Occupied.' },
      { kind: 'say', speaker: 'narrator', text: 'A pause, then, unprompted—' },
      { kind: 'say', speaker: 'occupant', text: 'There is a queue.' },
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'There is not, audibly, a queue. There has never, audibly, been a queue.',
      },
    ],
    choices: [
      { text: 'Wait.', next: 'outhouse:wait' },
      { text: 'The lamination is not legally binding.', next: 'outhouse:enter' },
    ],
  },
  'outhouse:wait': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'You join the queue that does not exist, notionally first in line for it. Minutes pass with the settled confidence of someone who has budgeted for this. You did not budget for this.',
      },
    ],
    choices: [
      { text: 'A little longer.', next: 'outhouse:waitLonger' },
      { text: 'You cannot wait a little longer.', next: 'outhouse:accident' },
    ],
  },
  'outhouse:waitLonger': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: "You are still queued. The sign has not turned, has not been asked to turn, and gives every indication that turning is somebody else's department.",
      },
    ],
    choices: [
      { text: 'One more minute.', next: 'outhouse:accident' },
      { text: 'Enough of this.', next: 'outhouse:enter' },
    ],
  },
  'outhouse:accident': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'The queue was never going to call your number. You stop waiting for it. Best not to elaborate further.',
      },
    ],
  },
  'outhouse:enter': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'The lamination, it turns out, was never load-bearing. The occupant has Strong Opinions, several beginning with—',
      },
      { kind: 'say', speaker: 'occupant', text: 'Someone is going to hear about this.' },
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'None of them slow you down. Somebody is, in fact, about to write a letter. It will not reach you either.',
      },
    ],
  },
} satisfies Record<string, DialogNode>;
