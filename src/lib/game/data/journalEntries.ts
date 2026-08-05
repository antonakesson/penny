import type { Condition } from './condition';

export interface JournalVariant {
  // Evaluated in order, first match wins. An unconditioned variant is the
  // fallback.
  when?: Condition;
  text: string;
}

// An id with no entry here is just not worth writing down.
export const JOURNAL_ENTRIES: Partial<Record<string, readonly JournalVariant[]>> = {
  genie: [
    {
      text: 'The cork popped on its own. Something stepped out of the smoke.',
    },
  ],
  occupiedOuthouse: [
    {
      text: 'Found an outhouse. The OCCUPIED sign was laminated. Someone takes this seriously.',
    },
  ],
  'outhouse:accident': [
    {
      text: "Waited outside an outhouse for a queue that didn't exist. Regret was immediate and specific.",
    },
  ],
  'outhouse:enter': [
    {
      text: "Went in anyway. Someone's writing a letter about it. Wonder if it'll arrive.",
    },
  ],
  'unpromptedCreek:linger': [
    {
      text: 'Waited by a creek for a reason to keep waiting. None arrived. Jumped it anyway.',
    },
  ],
};
