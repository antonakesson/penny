// Trimmed skeleton set (one item per zone1/zone2, two per zone3/zone4)
// to prove out drop resolution — not the full item list, that's a
// separate scope/task.
export const ITEMS = {

  kelpFragment: { name: 'Kelp Fragment' },
  carBattery: { name: 'Car Battery', description: 'Where else would you throw it?' },
  rustyHook: { name: 'Rusty Hook', onUseEffect: 'tetanus' },
  bluefinScale: { name: 'Unidentified Scales' },
  waterloggedLedger: { name: 'Waterlogged Ledger', description: 'Half a mutiny plan. The other half was apparently the important half.' },

  frostbittenScrap: { name: 'Frostbitten Scrap' },
  tidalPearl: { name: 'Tidal Pearl' },

  fivefootpole: { name: 'Five Foot Pole' },

  // Gear: an item with `stats` is equippable (see engine.js equipItem);
  // items without `stats` are plain materials. Stat values are
  // fractional bonuses (0.10 = +10%) — no effects wired to them yet,
  // this is just the scaffold survival/other systems will read later.
  // Crafted, not dropped — see recipes.js.
  fishingRodOfDesperation: {
    name: 'Fishing Rod of Desperation',
    stats: { yieldMultiplier: 0.1 },
  },
  kelpGString: {
    name: 'Kelp Thong',
    description: 'Snug as a tourniquet.',
    onUseEffect: 'chafing',
  },
};
