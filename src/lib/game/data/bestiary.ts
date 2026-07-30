import type { ENCOUNTERS } from './encounters';

// The pokedex, not a mirror of encounters.ts — a curated subset. Only what's
// listed here gets a stamped entryNo and gets discovery-tracked at all,
// which is why one-shot story beats (hastilyAbandonedCamp) and unfinished
// placeholders (rabbidSquirrel) simply have no row: they aren't a species to
// log. Matched to its ENCOUNTERS def by name, not id, so this list stays
// free to reorder/annotate without touching combat data.
//
// note is the protagonist's own diary aside, separate from the encounter's
// own description (see encounters.ts) - first person, written in the
// moment, not curated lore. Filled in sparsely as inspiration strikes: some
// entries get a flat, unremarkable observation, some get real interior
// mess (self-justification, second-guessing, the Raskolnikov register),
// most get nothing at all - not every kill earned a diary entry.
//
// Exception: entry 1 (Boar) predates the protagonist entirely - this
// bestiary is a found object (see hastilyAbandonedCamp), abandoned
// mid-use by a previous owner who liked to draw, and its one finished
// page is theirs, not the protagonist's. Everything from entry 2 onward
// is the protagonist continuing the work.
export interface BestiaryEntry {
  name: string;
  entryNo: number;
  note?: string;
}

// as const (not just satisfies) so `name` stays a union of literal strings -
// that's what makes the compile-time check below actually catch a typo or a
// forgotten row, instead of everything collapsing to `string`.
export const BESTIARY_ENTRIES = [
  // Previous owner's hand, not the protagonist's - see the exception note
  // above.
  {
    name: 'Boar',
    entryNo: 1,
    note: '"Stood very still for eleven minutes to get the shading right on the near foreleg. Worth it."',
  },
  { name: 'Honeybee', entryNo: 2, note: 'Standard issue bee.' },
  { name: 'Badger', entryNo: 3 },
  { name: 'Thorny Shrubbery', entryNo: 4 },
  { name: 'Fish', entryNo: 5 },
  { name: 'Watersnake', entryNo: 6 },
  { name: 'Fox', entryNo: 7 },
  { name: 'Moose', entryNo: 8 },
  { name: 'Blueberry', entryNo: 9 },
  { name: 'Duck. Just a Duck.', entryNo: 10 },
  {
    name: 'Deceptive Mound (Looking Solid But Was Actually Wet Feet)',
    entryNo: 11,
    note: 'Third confirmed instance of attacking the wetland itself. Logging this so it stops happening. It will not stop happening.',
  },
  { name: 'Feral Goat', entryNo: 12 },
  { name: 'Ruffian', entryNo: 13 },
  { name: 'Suspiciously Organized Rat King', entryNo: 14 },
  { name: 'Guy Who Definitely Owns This Now', entryNo: 15 },
  { name: 'The Auditor', entryNo: 16 },
] as const satisfies readonly BestiaryEntry[];

const byName = new Map<string, BestiaryEntry>(BESTIARY_ENTRIES.map((entry) => [entry.name, entry]));

export function getBestiaryEntry(name: string): BestiaryEntry | undefined {
  return byName.get(name);
}

// Compile-time only, erased at runtime - every 'monster'-kind encounter must
// have a matching row above. A new monster def with no bestiary entry (or a
// name typo breaking the match) fails `npm run check` immediately, naming
// the offending monster name in the type error, instead of silently
// shipping a creature nobody can ever look up. Deliberately scoped to
// kind: 'monster' only - investigation-kind bestiary membership (Thorny
// Shrubbery yes, the one-shot camp event no) stays a curated call; kind
// alone can't tell "recurring critter" from "story beat" apart.
// A mapped type, not a generic conditional applied to `keyof typeof
// ENCOUNTERS` directly - the latter evaluates the `extends` check against
// the union of every encounter type at once (always false, since not all
// of them are 'monster'), collapsing to `never` unconditionally instead of
// checking each entry on its own.
type MonsterName = {
  [K in keyof typeof ENCOUNTERS]: (typeof ENCOUNTERS)[K] extends { kind: 'monster' }
    ? (typeof ENCOUNTERS)[K]['name']
    : never;
}[keyof typeof ENCOUNTERS];
type BestiaryName = (typeof BESTIARY_ENTRIES)[number]['name'];
type MissingBestiaryEntry = Exclude<MonsterName, BestiaryName>;
const _allMonstersCatalogued: [MissingBestiaryEntry] extends [never]
  ? true
  : ['Missing bestiary entry for', MissingBestiaryEntry] = true;
void _allMonstersCatalogued;
