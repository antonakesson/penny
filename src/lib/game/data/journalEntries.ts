import type { Condition } from './condition';

export interface JournalVariant {
  // Evaluated in order, first match wins. An unconditioned variant is the
  // fallback - "guarded by a flag / guarded by its absence" falls out of
  // ordering alone, no explicit negation needed for the common case.
  when?: Condition;
  text: string;
}

// Flat table, one namespace across every trigger id that can produce a
// diary line - dialog nodes, encounter ids, item drops, whatever id gets
// passed to logJournalEntry() in engine.ts. An id with no entry here is
// just not worth writing down; most encounters won't have one.
export const JOURNAL_ENTRIES: Partial<Record<string, readonly JournalVariant[]>> = {
  // No flag-gated variant here anymore - summonGenie's own guardFlag (see
  // effects.ts) means this can only ever fire once per game, so there's no
  // "reached it again" case left to author text for.
  genie: [
    {
      text: 'The cork popped on its own. Something stepped out of the smoke.',
    },
  ],
};
