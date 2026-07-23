import { ACTION, MONSTER_DEATH_MS, OFFLINE_CAP_MS } from './config';
import { getMonster, damageMonster, spawnMonster, killMonster } from './state/monster.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { getCurrentZoneId } from './state/zone.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem } from './state/inventory.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS, type ItemId } from './data/loot';
import { ZONES, pickMonsterId, type ZoneId } from './data/zones';
import { MONSTERS, type MonsterId } from './data/monstats';

export function startAction() {
  const action = getAction();
  if (action.status !== 'idle') return;
  if (getMonster().status !== 'active') return;
  setActionActive(Date.now());
}

export function tick() {
  const action = getAction();
  if (action.startedAt !== null) {
    const elapsed = Date.now() - action.startedAt;
    if (action.status === 'active') {
      if (elapsed >= ACTION.activeMs) resolveAction();
    } else if (action.status === 'cooldown') {
      if (elapsed >= ACTION.cooldownMs) setActionIdle();
    }
  }

  const monster = getMonster();
  if (monster.status === 'dead' && monster.diedAt !== null && Date.now() - monster.diedAt >= MONSTER_DEATH_MS) {
    spawnMonster();
  }
}

interface HitResult {
  xpReward: number;
  drops: ItemId[];
}

// One damage tick against the current monster; returns the kill payload
// (xp + drops) if that hit finished it off, so both live combat and offline
// catch-up can share the exact same resolution — only presentation differs.
function applyHit(): HitResult | null {
  const monster = getMonster();
  damageMonster(1);
  if (monster.hp > 0) return null;

  const xpReward = monster.xpReward;
  const drops = resolveDropIds(monster.dropTableId);
  awardXp(xpReward);
  for (const dropId of drops) addItem(dropId, 1);
  killMonster();
  return { xpReward, drops };
}

function resolveAction() {
  spawnFloatingText('-1', 'damage');
  const result = applyHit();
  if (result) {
    for (const dropId of result.drops) {
      spawnLootText(`+1 ${ITEMS[dropId].name}`, ITEMS[dropId].rarity);
    }
  }
  setActionCooldown(Date.now());
}

export interface OfflineSummary {
  kills: number;
  xpGained: number;
  itemsGained: Record<string, number>;
}

// hp-weighted by the same spawn odds pickMonsterId uses, so the estimate
// tracks the zone's actual mix rather than a naive per-species average.
function averageMonsterHp(zoneId: ZoneId): number {
  const monsters = ZONES[zoneId].monsters;
  const totalWeight = monsters.reduce((sum, m) => sum + m.weight, 0);
  const weightedHp = monsters.reduce((sum, m) => sum + m.weight * MONSTERS[m.id].maxHp, 0);
  return weightedHp / totalWeight;
}

function awardKill(id: MonsterId): { xpReward: number; drops: ItemId[] } {
  const base = MONSTERS[id];
  awardXp(base.xpReward);
  const drops = resolveDropIds(base.dropTableId);
  for (const dropId of drops) addItem(dropId, 1);
  return { xpReward: base.xpReward, drops };
}

// Fast-forwards time spent away. Rather than stepping through every attack
// cycle, estimates a kill count from average time-per-kill (playerDps
// against the zone's hp-weighted average monster) and only loops to
// itemize loot for that many virtual kills — the one part that has to stay
// a real per-kill roll if drops are going to be actual named items and not
// a statistical blur. A "pretty good approximation," not a frame-accurate
// replay: it assumes attacks landed back-to-back with no missed cycles,
// same as it always has.
export function simulateOffline(elapsedMs: number): OfflineSummary {
  const cappedMs = Math.min(elapsedMs, OFFLINE_CAP_MS);
  const cycleMs = ACTION.activeMs + ACTION.cooldownMs;
  const zoneId = getCurrentZoneId();

  const playerDps = 1 / cycleMs; // damage per ms — today's only combat stat
  const avgTimePerKillMs = averageMonsterHp(zoneId) / playerDps + MONSTER_DEATH_MS;
  const killCount = Math.floor(cappedMs / avgTimePerKillMs);

  let xpGained = 0;
  const itemsGained: Record<string, number> = {};
  for (let i = 0; i < killCount; i++) {
    const result = awardKill(pickMonsterId(zoneId));
    xpGained += result.xpReward;
    for (const dropId of result.drops) {
      itemsGained[dropId] = (itemsGained[dropId] ?? 0) + 1;
    }
  }

  if (killCount > 0) spawnMonster();
  return { kills: killCount, xpGained, itemsGained };
}
