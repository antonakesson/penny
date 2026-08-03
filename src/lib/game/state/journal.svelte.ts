// Chronological, authored, append-only storage. Lookup/composition logic
// lives in engine.ts, not here - this module only holds entries.
export interface JournalEntry {
  id: string;
  text: string;
}

let entries = $state<JournalEntry[]>([]);

export function appendEntry(id: string, text: string) {
  entries = [...entries, { id, text }];
}

export function getEntries(): readonly JournalEntry[] {
  return entries;
}

export function serializeEntries(): JournalEntry[] {
  return entries;
}

export function hydrateEntries(value: JournalEntry[]) {
  entries = value;
}
