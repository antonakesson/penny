import type { DialogNode } from '../dialog';

export default {
  // One choice, not zero - action lines only fire on a choice-driven
  // transition (see resolveDialogChoice() in dialogEngine.ts), never on the
  // root node shown at spawn. The wall below needs that transition to exist
  // at all, or toggleDirection never gets a chance to fire.
  'cliffsEdge:root': {
    lines: [
      {
        kind: 'say',
        speaker: 'narrator',
        text: "The ground stops. Treetops continue for as long as you care to look, an uninterrupted green making no particular effort to end. Nothing about the drop invites a closer look, so you decline to give it one.",
      },
    ],
    choices: [{ text: 'Step back from the edge.', next: 'cliffsEdge:stepBack' }],
  },
  // The actual wall. toggleDirection (data/effects.ts) flips `returning` -
  // reaching this POI is only possible while retreating (see zones.ts's
  // comment on the subzone), so this always flips retreat into advance.
  // dismissDialog() (dialogEngine.ts) runs its own advance() right after
  // this node resolves (no choices below = terminal), and by then the flip
  // has already landed - so that one ordinary step lands back on -1
  // (Gwendolyn's cat) instead of continuing to -3. No dedicated "wall"
  // mechanism anywhere - this is the existing Turn Around effect, reused,
  // plus the advance the engine was always going to run anyway.
  'cliffsEdge:stepBack': {
    lines: [
      { kind: 'action', effect: 'toggleDirection' },
      {
        kind: 'say',
        speaker: 'narrator',
        text: 'There is nothing further to see from here that you did not already see from slightly further back. You turn around.',
      },
    ],
  },
} satisfies Record<string, DialogNode>;
