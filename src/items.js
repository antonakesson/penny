// minZoneLevel documents the intended power tier of an item (like a D2
// item level) — it isn't runtime-enforced. Zone drop tables are curated
// by hand in zones.js; this field is a sanity check for that curation
// and future-proofing for recipes that gate on it.
export const ITEMS = {
  herring: { name: 'Herring', minZoneLevel: 1, rarity: 'common' },
  rustyHook: { name: 'Rusty Hook', minZoneLevel: 1, rarity: 'common' },

  bluefinScale: { name: 'Bluefin Scale', minZoneLevel: 5, rarity: 'common' },
  waterloggedLedger: { name: 'Waterlogged Ledger', minZoneLevel: 5, rarity: 'uncommon' },

  arcticCod: { name: 'Arctic Cod', minZoneLevel: 8, rarity: 'common' },
  arcticCodGlycerin: { name: 'Arctic Cod Glycerin', minZoneLevel: 8, rarity: 'uncommon' },
  frostbittenNetScrap: { name: 'Frostbitten Net Scrap', minZoneLevel: 8, rarity: 'common' },

  krakenInkSac: { name: 'Kraken Ink Sac', minZoneLevel: 12, rarity: 'uncommon' },
  brokenTentacleHook: { name: 'Broken Tentacle Hook', minZoneLevel: 12, rarity: 'common' },
  abyssalPearl: { name: 'Abyssal Pearl', minZoneLevel: 12, rarity: 'rare' },

  sirenScale: { name: 'Siren Scale', minZoneLevel: 15, rarity: 'uncommon' },
  waxEarplug: { name: 'Wax Earplug', minZoneLevel: 15, rarity: 'common' },
  enchantedCoral: { name: 'Enchanted Coral', minZoneLevel: 15, rarity: 'rare' },

  mutineersLedgerPage: { name: "Mutineer's Ledger Page", minZoneLevel: 20, rarity: 'uncommon' },
  bountyDoubloon: { name: 'Bounty Doubloon', minZoneLevel: 20, rarity: 'common' },
  captainsLostCompass: { name: "Captain's Lost Compass", minZoneLevel: 20, rarity: 'legendary' },
};
