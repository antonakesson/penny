// The diary half of the journal system (see journal_system memory) -
// chronological, authored, append-only. Just storage: looking up whether an
// id has any authored content and picking the right variant is cross-domain
// composition (reads flag/inventory/feature state against journalEntries.ts
// data), so that logic lives in engine.ts's logJournalEntry(), same reason
// evaluateDialogCondition lives there and not in a state slice.
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
