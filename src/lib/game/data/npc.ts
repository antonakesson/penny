// The identity catalog - source of truth for anyone in this world with a
// name: dialog speakers, quote attributions, eventually a monster or
// journal entry that turns out to be someone rather than something. An id
// here is a real person (or voice, or whatever this world's version of one
// is) that recurs or could recur; a generic monster/prop stays inline in
// its own registry (encounters.ts's `name`) instead of getting an entry
// here just to have one.
//
// NpcId is derived from NPCS' own keys (not hand-written) specifically so
// deleting an entry is a compile error everywhere that entry was still
// referenced (a dialog speaker, a `rename` line, a quote attribution) -
// dangling references surface at build time instead of silently rendering
// undefined.
export interface NpcDef {
  name: string;
  // Shown alongside name wherever an attribution/byline renders (see
  // formatAttribution in components/data/flavor.ts). Absent for names that
  // don't need one (the Genie doesn't have a job title).
  title?: string;
}

export const NPCS = {
  genie: { name: 'The Genie' },
  occupant: { name: 'A Voice', title: 'From Within' },
  cobbThistlewood: { name: 'Cobb Thistlewood', title: 'Ranger / Coroner' },
  elsa: { name: 'Elsa', title: 'Hairdresser' },
  widowPruitt: { name: 'Widow Pruitt', title: 'Innkeeper' },
} as const satisfies Record<string, NpcDef>;

export type NpcId = keyof typeof NPCS;
