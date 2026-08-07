import type { ZoneId } from '../../game/data/zones';
import type { EncounterId } from '../../game/data/encounters';
import { NPCS, type NpcDef, type NpcId } from '../../game/data/npc';

// Presentation only - nothing here has a mechanical effect, and nothing in
// game/* (engine.ts, map.ts, encounter.svelte.ts) imports this file. zones.ts
// only needs to know a subzone/encounter exists (by id); what it says about
// itself is entirely this layer's concern. See zones.ts's SubZoneDef.id
// comment for the boundary this keys off of.
export interface Quote {
  text: string;
  // Either a registered identity - looked up + formatted via
  // formatAttribution() below - or a one-off freeform source with no NPCS
  // entry of its own (an unsigned note, "a voice" with nothing further to
  // say about it). Pointing at an NpcId instead of just typing the string
  // twice means renaming/retiring that NPC is a compile error at every
  // attribution that still names them, not a silently stale byline.
  attribution: NpcId | { freeform: string };
}

export function formatAttribution(attribution: Quote['attribution']): string {
  if (typeof attribution !== 'string') return attribution.freeform;
  const npc: NpcDef = NPCS[attribution];
  return npc.title ? `${npc.name}, ${npc.title}` : npc.name;
}

interface SubZoneFlavor {
  description?: string;
  quote?: Quote;
}

// Keyed by SubZoneDef.id, not name - renaming a subzone's display name
// shouldn't silently orphan its flavor text.
export const SUBZONE_FLAVOR: Record<ZoneId, Record<string, SubZoneFlavor>> = {
  zone1: {
    // Secret, and meant to stay that way - reachable only by retreating
    // past distance 0 (see zones.ts's comment on this subzone). Description
    // leans on the actual math instead of describing a place, on purpose:
    // there's no in-fiction reason for this ground to be strange, since it's
    // the same woods either way - it's strange only relative to a zero
    // someone drew on a number line, which is exactly the joke.
    youHaveBeenHereBefore: {
      description:
        "Somewhere back there, someone drew a line and called it zero. Everything on this side of it is just displacement in the negative direction — the same ground, the same trees, filed on the wrong side of an arbitrary reference point. The trail doesn't know it's already been walked. Only you do.",
    },
    treeLine: {
      description:
        'The trees are suspiciously well-behaved — evenly spaced, uniformly tall, like something got tired of the mess and started grooming. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose.',
      quote: {
        text: "If you don't count the people who don't come back, the forest is 100% safe.",
        attribution: 'cobbThistlewood',
      },
    },
    // DRAFT - placeholder, not locked in. See LORE.md's Deep Woods entry.
    deepWoods: {
      description:
        "Past the tree line proper, the Ranger Office's numbered trail markers grow sparse, then stop entirely — mid-post, as if whoever was counting simply lost the thread. Official policy holds that the trail continues regardless; it declines to specify for how long that's supposed to be reassuring.",
      quote: {
        text: "I don't know how I made it out. My hands were shaking for hours after. She never even raised her voice.",
        attribution: { freeform: 'witchcraft survivor' },
      },
    },
  },
  // DRAFT - placeholder, not locked in.
  zone2: {
    rainbowBog: {
      description:
        'The name predates the bog. Nobody currently employed by any nearby settlement can explain the rainbow part, and several have stopped trying.',
      quote: {
        text: "You don't sink in the Bog. The Bog just gets taller around you.",
        attribution: 'widowPruitt',
      },
    },
  },
  // DRAFT - same caveats as zone2.
  zone3: {
    theLastLedger: {
      description:
        'Somebody kept immaculate records here, right up until they stopped. The books are still open on the desk, mid-entry, as if whoever was writing just meant to step out for a moment.',
      quote: {
        text: 'Possession is nine-tenths of the law. The other tenth is whoever still has the stamp.',
        attribution: { freeform: 'Marginal note, unsigned ledger' },
      },
    },
  },
};

interface EncounterFlavor {
  // Zone.svelte: overwrites just the quote slot when this encounter is the
  // active one - the subzone's own quote (and description) stays put
  // otherwise. Not every encounter needs an entry; most fights have nothing
  // to say about the zone itself.
  quote?: Quote;
  // Flavortext.svelte: one static blurb, shown for the whole hold. Monster/
  // social encounters only ever have this form, never beats.
  description?: string;
  // Flavortext.svelte: beats revealed in order as investigation progress
  // advances, instead of one static blurb. Investigation encounters only
  // ever have this form, never description.
  beats?: readonly string[];
}

// Keyed by EncounterId - same rationale as SUBZONE_FLAVOR above. encounters.ts
// only needs to know an encounter exists and what kind it is; what it says
// about itself is entirely this layer's concern.
export const ENCOUNTER_FLAVOR: Partial<Record<EncounterId, EncounterFlavor>> = {
  hastilyAbandonedCamp: {
    beats: ['The embers are still warm. Whoever left here didn’t mean to.'],
  },
  // Default/declared id - what's placed in zones.ts. Same coordinate, same
  // name, either way; only the last line of the beat (and the squirrel's
  // mood) says otherwise. See encounters.ts's ENCOUNTER_SUBSTITUTIONS.
  pleasantClearing: {
    beats: [
      "The trees pull back just enough to let real sunlight through, for once. Warm, quiet, unbothered — the kind of clearing that ends up on a postcard nobody in this forest has ever sent. You notice, distantly, that you haven't seen a single bird since you walked in.",
    ],
  },
  // Substituted in once `pet` is unlocked - never placed directly.
  pleasantClearingRecruited: {
    beats: [
      'The trees pull back just enough to let real sunlight through, for once. Warm, quiet, unbothered — the kind of clearing that ends up on a postcard nobody in this forest has ever sent. Your squirrel flops onto its back in the grass and does not get up.',
    ],
  },
  forkTowardTheBog: {
    description:
      "Whatever put the marker here didn't bother carving a name into it — just an arrow, pointing off the packed trail into ground that squelches instead of crunches. Someone has since added, in a different hand and clearly after the fact: 'Boots off is a suggestion.'",
  },
  forkBackToTheWoods: {
    description:
      "The marker here has sunk to about knee height, same as everything else that stood still too long. Only the arrow's still legible, pointing back at solid ground with what might generously be called enthusiasm.",
  },
};
