import type { ZoneId } from '../../game/data/zones';
import type { EncounterId } from '../../game/data/encounters';

// Presentation only - nothing here has a mechanical effect, and nothing in
// game/* (engine.ts, map.ts, encounter.svelte.ts) imports this file. zones.ts
// only needs to know a subzone/encounter exists (by id); what it says about
// itself is entirely this layer's concern. See zones.ts's SubZoneDef.id
// comment for the boundary this keys off of.
export interface Quote {
  text: string;
  attribution: string;
}

interface SubZoneFlavor {
  description?: string;
  quote?: Quote;
}

// Keyed by SubZoneDef.id, not name - renaming a subzone's display name
// shouldn't silently orphan its flavor text.
export const SUBZONE_FLAVOR: Record<ZoneId, Record<string, SubZoneFlavor>> = {
  zone1: {
    treeLine: {
      description:
        'The trees are suspiciously well-behaved — evenly spaced, uniformly tall, like something got tired of the mess and started grooming. Adventurers who linger report a profound sense of purpose, followed shortly by a normal sense of purpose.',
      quote: {
        text: "If you don't count the people who don't come back, the forest is 100% safe.",
        attribution: 'Cobb Thistlewood, Ranger / Coroner',
      },
    },
    // DRAFT - placeholder, not locked in. See LORE.md's Deep Woods entry.
    deepWoods: {
      description:
        "Past the tree line proper, the Ranger Office's numbered trail markers grow sparse, then stop entirely — mid-post, as if whoever was counting simply lost the thread. Official policy holds that the trail continues regardless; it declines to specify for how long that's supposed to be reassuring.",
      quote: {
        text: 'Half my regulars stopped coming back after Tree Line. The other half just started going further in first.',
        attribution: 'Elsa, Licensed Companionship Consultant',
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
        attribution: 'Widow Pruitt, Innkeeper',
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
        attribution: 'Marginal note, unsigned ledger',
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
  // Discovery.svelte: one static blurb, shown for the whole hold. Monster/
  // social encounters only ever have this form, never beats.
  description?: string;
  // Discovery.svelte: beats revealed in order as investigation progress
  // advances, instead of one static blurb. Investigation encounters only
  // ever have this form, never description.
  beats?: readonly string[];
}

// Keyed by EncounterId - same rationale as SUBZONE_FLAVOR above. encounters.ts
// only needs to know an encounter exists and what kind it is; what it says
// about itself is entirely this layer's concern.
export const ENCOUNTER_FLAVOR: Partial<Record<EncounterId, EncounterFlavor>> = {
  occupiedOuthouse: {
    quote: {
      text: 'Occupied.',
      attribution: 'A Voice, From Within',
    },
  },
  fish: {
    description: 'Not the first of its kind to try to walk on land. The others, notably, did not go back.',
  },
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
};
