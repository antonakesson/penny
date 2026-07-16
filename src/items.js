// Trimmed skeleton set (one item per zone1/zone2, two per zone3/zone4)
// to prove out drop resolution — not the full item list, that's a
// separate scope/task.
export const ITEMS = {
  kelpFragment: { name: 'Kelp Fragment', rarity: 'common' },
  rustyHook: { name: 'Rusty Hook', rarity: 'common' },

  bluefinScale: { name: 'Bluefin Scale', rarity: 'common' },
  waterloggedLedger: { name: 'Waterlogged Ledger', rarity: 'uncommon' },

  frostbittenScrap: { name: 'Frostbitten Scrap', rarity: 'common' },
  tidalPearl: { name: 'Tidal Pearl', rarity: 'rare' },

  // Gear: an item with `stats` is equippable (see engine.js equipItem);
  // items without `stats` are plain materials. Stat values are
  // fractional bonuses (0.10 = +10%) — no effects wired to them yet,
  // this is just the scaffold survival/other systems will read later.
  captainZoransBinoculars: {
    name: "Captain Zoran's Binoculars",
    rarity: 'rare',
    stats: { navigationAccuracy: 0.1, treasureFind: 0.1 },
  },
};
