import { ACTION, ENCOUNTER_END_MS } from './config';
import { getEncounter, damageMonster, killMonster, spawnNextEncounter } from './state/encounter.svelte';
import { getTreasureRuntime, resolveTreasure } from './state/treasure.svelte';
import { getRecruitRuntime, advanceStage, resolveRecruitEvent, setHeldMs, setLastTickAt } from './state/recruitEvent.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem } from './state/inventory.svelte';
import { addMercenary } from './state/mercenary.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS } from './data/loot';
import { EVENTS, type EventId, type RecruitEventDef } from './data/events';

export function startAction() {
  const action = getAction();
  if (action.status !== 'idle') return;
  const encounter = getEncounter();
  if (encounter.kind !== 'monster' || encounter.monster.status !== 'active') return;
  setActionActive(Date.now());
}

export function tick() {
  const action = getAction();
  if (action.startedAt !== null) {
    const elapsed = Date.now() - action.startedAt;
    if (action.status === 'active') {
      if (elapsed >= ACTION.activeMs) resolveHit();
    } else if (action.status === 'cooldown') {
      if (elapsed >= ACTION.cooldownMs) setActionIdle();
    }
  }

  const encounter = getEncounter();
  const now = Date.now();
  if (encounter.kind === 'monster') {
    const { monster } = encounter;
    if (monster.status === 'dead' && monster.diedAt !== null && now - monster.diedAt >= ENCOUNTER_END_MS) {
      spawnNextEncounter();
    }
  } else if (encounter.kind === 'treasure') {
    tickTreasure(encounter.id, now);
  } else {
    tickRecruitEvent(encounter.id, now);
  }
}

// Shared by monster kills and treasure resolutions — xp/inventory/floating
// text don't care which kind of encounter produced the drops.
function awardLoot(dropTableId: readonly string[], xpReward: number) {
  const drops = resolveDropIds(dropTableId);
  awardXp(xpReward);
  for (const dropId of drops) addItem(dropId, 1);
  for (const dropId of drops) spawnLootText(`+1 ${ITEMS[dropId].name}`, ITEMS[dropId].rarity);
}

function resolveHit() {
  const encounter = getEncounter();
  if (encounter.kind !== 'monster') {
    setActionCooldown(Date.now());
    return;
  }
  spawnFloatingText('-1', 'damage');
  damageMonster(1);
  if (encounter.monster.hp <= 0) {
    awardLoot(encounter.monster.dropTableId, encounter.monster.xpReward);
    killMonster();
  }
  setActionCooldown(Date.now());
}

function tickTreasure(id: EventId, now: number) {
  const def = EVENTS[id];
  if (def.kind !== 'treasure') return;
  const runtime = getTreasureRuntime();
  if (runtime.status === 'active' && runtime.startedAt !== null) {
    if (now - runtime.startedAt >= def.durationMs) {
      awardLoot(def.dropTableId, def.xpReward);
      resolveTreasure();
    }
  } else if (runtime.status === 'resolved' && runtime.resolvedAt !== null && now - runtime.resolvedAt >= ENCOUNTER_END_MS) {
    spawnNextEncounter();
  }
}

function completeStage(def: RecruitEventDef, stageIndex: number) {
  if (stageIndex + 1 >= def.stages.length) {
    addMercenary(def.mercenaryId);
    spawnLootText(`Recruited ${def.name}!`, 'rare');
    resolveRecruitEvent();
  } else {
    advanceStage();
  }
}

function tickRecruitEvent(id: EventId, now: number) {
  const def = EVENTS[id];
  if (def.kind !== 'recruit') return;
  const runtime = getRecruitRuntime();

  if (runtime.status === 'resolved') {
    if (runtime.resolvedAt !== null && now - runtime.resolvedAt >= ENCOUNTER_END_MS) spawnNextEncounter();
    return;
  }

  const stage = def.stages[runtime.stageIndex];
  if (stage.interaction === 'hold') {
    if (runtime.lastTickAt === null) {
      setLastTickAt(now);
      return;
    }
    const delta = now - runtime.lastTickAt;
    setLastTickAt(now);
    const nextHeld = runtime.isHolding ? Math.min(stage.durationMs, runtime.heldMs + delta) : Math.max(0, runtime.heldMs - delta);
    setHeldMs(nextHeld);
    if (nextHeld >= stage.durationMs) completeStage(def, runtime.stageIndex);
  } else if (runtime.stageStartedAt !== null) {
    if (now - runtime.stageStartedAt >= stage.durationMs) completeStage(def, runtime.stageIndex);
  }
}
