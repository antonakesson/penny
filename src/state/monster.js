// State-owner for state.monster: the live encounter instance.
// spawnMonster bakes in everything a kill will need — hp, the xp
// reward, and the drop table id — computed once, here, from the
// current zone + MONSTERS. resolveMonsterKill (engine.js) never
// re-derives any of that from the monster's id/level a second time;
// it just reads the instance.
import { getState, notify } from './state.js';
import { ZONES } from '../data/zones.js';
import { MONSTERS } from '../data/monstats.js';

// Spawns a monster into state.monster whenever there isn't a live one
// to fight — none yet, or the last one's dead but hasn't been
// replaced. Safe to call unconditionally at startup, whether this is
// a fresh game or a reload mid-encounter.
export function ensureMonster() {
  const monster = getState().monster;
  if (!monster || monster.hp <= 0) spawnMonster();
}

export function spawnMonster() {
  const zone = ZONES[getState().zones.current];
  const id = zone.monsters[Math.floor(Math.random() * zone.monsters.length)];
  const level = zone.monsterLevel;
  const base = MONSTERS[id];
  const hp = (base.hp + base.hpPerLevel * (level - 1)) * (base.hpMul ?? 1);
  const xpReward = (base.xp + base.xpPerLevel * (level - 1)) * (base.xpMul ?? 1);
  getState().monster = { id, level, hp, maxHp: hp, xpReward, drop: base.drop };
  notify();
}

export function damageMonster(amount) {
  const monster = getState().monster;
  if (!monster) return;
  monster.hp = Math.max(0, monster.hp - amount);
  notify();
}
