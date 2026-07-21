// Monster data: base stats, mixins, and loot — a basic monstats.txt.
// hp/xp scale off the level the spawning zone provides, not a level
// field of their own — state/monster.js's spawnMonster resolves both
// at spawn time and bakes the result into the live instance. drop
// references loot.js's TREASURE_CLASSES/ITEMS registry by id — a
// use-site, not a copy of that data.
//
// type/vulnerability are plain flags, not scaled fields — spread in
// from a shared mixin and read directly wherever combat logic
// eventually cares (e.g. a future damage-type system), no resolver
// needed. hp/hpPerLevel/xp/xpPerLevel (and optional hpMul/xpMul, once
// something like a boss mixin needs them) are the only fields
// spawnMonster's formulas touch.
const undead = { type: 'undead', vulnerability: 'bludgeoning' };

export const MONSTERS = {
  boar: { name: 'Boar', hp: 8, hpPerLevel: 2, xp: 3, xpPerLevel: 1, drop: 'misc' },
  zombie: { name: 'Zombie', hp: 16, hpPerLevel: 3, xp: 6, xpPerLevel: 1, ...undead, drop: 'misc' },
};
