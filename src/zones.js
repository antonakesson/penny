// Zone data: which monsters a zone can spawn and at what level — a
// basic levels.txt. The zone owns monster level; monstats.js's
// entries scale against whatever level the zone hands them, so the
// same monster id is reusable across zones at different levels.
export const ZONES = {
  zone1: { name: 'Zone 1', monsterLevel: 1, monsters: ['dummy'] },
};
