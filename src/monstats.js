// Monster data: base stats and loot — a basic monstats.txt. hp scales
// off the level the spawning zone provides (engine.js's
// spawnMonster), not a level field of its own. drop references
// loot.js's TREASURE_CLASSES/ITEMS registry by id — a use-site, not a
// copy of that data.
export const MONSTERS = {
  dummy: { name: 'Dummy', hp: 10, hpPerLevel: 2, drop: 'misc' },
};
