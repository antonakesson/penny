import { ACTION, ENCOUNTER_END_MS } from './config';
import { getEncounter, damageMonster, killMonster, spawn } from './state/encounter.svelte';
import { getTreasureRuntime, resolveTreasure, startInvestigating } from './state/treasure.svelte';
import {
  getRecruitRuntime,
  advanceStage,
  resolveRecruitEvent,
  setHeldMs,
  setLastTickAt,
  startStage,
} from './state/recruitEvent.svelte';
import { getAction, setActionActive, setActionCooldown, setActionIdle } from './state/action.svelte';
import { awardXp } from './state/xp.svelte';
import { addItem } from './state/inventory.svelte';
import { addPet } from './state/pet.svelte';
import { discoverMonster } from './state/bestiary.svelte';
import { spawnFloatingText, spawnLootText } from './state/floatingText.svelte';
import { resolveDropIds, ITEMS } from './data/loot';
import { EVENTS, type EventId, type PetEventDef } from './data/events';
import { assertNever } from './util/assertNever';

export function startAction() {
  const action = getAction();
  if (action.status !== 'idle') return;
  const encounter = getEncounter();
  if (encounter.kind !== 'monster' || encounter.monster.status !== 'active') return;
  setActionActive(Date.now());
}

// Single event/action-agnostic entrypoint for "the player tapped to act" —
// cross-slice composition (it knows about monster/treasure/pet slices), so
// it lives here rather than in encounter.svelte.ts.
export function click() {
  const encounter = getEncounter();
  switch (encounter.kind) {
    case 'monster':
      return startAction();
    case 'treasure':
      return startInvestigating();
    case 'pet':
      return startStage();
    default:
      return assertNever(encounter);
  }
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
  switch (encounter.kind) {
    case 'monster': {
      const { monster } = encounter;
      // Discovery is logged as soon as the monster is on screen, not on
      // kill — a no-op past the first tick it's seen, since discoverMonster
      // just sets a bit.
      discoverMonster(monster.entryNo);
      if (monster.status === 'dead' && monster.diedAt !== null && now - monster.diedAt >= ENCOUNTER_END_MS) {
        spawn();
      }
      return;
    }
    case 'treasure':
      return tickTreasure(encounter.id, now);
    case 'pet':
      return tickRecruitEvent(encounter.id, now);
    default:
      return assertNever(encounter);
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
    spawn();
  }
}

function completeStage(def: PetEventDef, stageIndex: number) {
  if (stageIndex + 1 >= def.stages.length) {
    addPet(def.petId);
    spawnLootText(`Recruited ${def.name}!`, 'rare');
    resolveRecruitEvent();
  } else {
    advanceStage();
  }
}

function tickRecruitEvent(id: EventId, now: number) {
  const def = EVENTS[id];
  if (def.kind !== 'pet') return;
  const runtime = getRecruitRuntime();

  if (runtime.status === 'resolved') {
    if (runtime.resolvedAt !== null && now - runtime.resolvedAt >= ENCOUNTER_END_MS) spawn();
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
