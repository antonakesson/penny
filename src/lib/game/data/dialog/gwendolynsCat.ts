import type { DialogNode } from '../dialog';

// Never named in-fiction - see encounters.ts's comment on the `gwendolynsCat`
// id itself for why. Both branches are terminal (no follow-up choices), same
// meow either way - there's genuinely nothing more to say yet, which is the
// stub this leaves for later, not an oversight.
export default {
  'gwendolynsCat:root': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'A cat sits square in the middle of ground that isn’t going anywhere, watching you with the specific patience of something that has been waiting a while and has made its peace with it. The collar is still on. Whatever the tag once said isn’t.',
      },
    ],
    choices: [
      { text: 'Crouch down.', next: 'gwendolynsCat:crouch' },
      { text: 'Ask where it came from.', next: 'gwendolynsCat:ask' },
    ],
  },
  'gwendolynsCat:crouch': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'It lets you get close. It does not move. It meows once, like a formality.',
      },
    ],
  },
  'gwendolynsCat:ask': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'It meows. This is, it becomes clear, the entire answer you are going to get.',
      },
    ],
  },
} satisfies Record<string, DialogNode>;
