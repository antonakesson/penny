// The journal domain's facade - engine.ts calls these semantic methods
// instead of reaching into journal state or journal data tables itself (see
// journal_system memory). Each one is "here's what just happened, in
// engine's own vocabulary"; this module decides whether that's worth an
// entry and/or a flag. All four currently do the same lookup-and-apply, but
// stay separate functions (not one generic `record(id)`) so a future event
// kind that needs to behave differently doesn't have to un-share first.
import { JOURNAL_ENTRIES } from './data/journalEntries';
import { FLAG_TRIGGERS } from './data/journalFlags';
import { evaluateCondition } from './condition';
import { appendEntry } from './state/journal.svelte';
import { setFlag } from './state/journalFlags.svelte';

function logEntry(id: string) {
  const variants = JOURNAL_ENTRIES[id];
  if (!variants) return;
  const variant = variants.find((v) => !v.when || evaluateCondition(v.when));
  if (variant) appendEntry(id, variant.text);
}

function applyFlagTrigger(id: string) {
  const flag = FLAG_TRIGGERS[id];
  if (flag) setFlag(flag);
}

export function itemDropped(id: string) {
  logEntry(id);
  applyFlagTrigger(id);
}

export function encounterSpawned(id: string) {
  logEntry(id);
  applyFlagTrigger(id);
}

export function encounterCompleted(id: string) {
  logEntry(id);
  applyFlagTrigger(id);
}

export function dialogNode(id: string) {
  logEntry(id);
  applyFlagTrigger(id);
}
