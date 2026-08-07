import type { DialogNode } from '../dialog';

export default {
  // No choices - a terminal node from the moment it's read, same as the
  // rest of youHaveBeenHereBefore's content. There's nothing to negotiate
  // with a view.
  'cliffsEdge:root': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: "The ground stops. Treetops continue for as long as you care to look, an uninterrupted green making no particular effort to end. Nothing about the drop invites a closer look, so you decline to give it one.",
      },
    ],
  },
} satisfies Record<string, DialogNode>;
