import { ENCOUNTER_END_MS } from './config';
import {
  getEncounter,
  createEncounter,
  interruptEncounter,
  dropEncounter,
  hasEncounter,
} from './state/encounter.svelte';
import { pickEncounter } from './map';
import { getCurrentZoneId } from './state/zone.svelte';
import { shouldShowEvent } from './state/events.svelte';
import { setActionIdle } from './state/action.svelte';
import { getLevel } from './state/xp.svelte';
import { removeItem } from './state/inventory.svelte';
import { ITEMS, type ItemId, type ItemDef } from './data/loot';
import { triggerEffect, isEffectActive } from './state/effect.svelte';
import { playSound } from './audio';
import { runCombatTick } from './combatEngine';
import type { Encounter } from './types';
import type { EncounterId } from './data/encounters';
import * as journal from './journal';

// Trivial/Easy/Even/Deadly, WoW-con-color style.
export type LevelGap = 'trivial' | 'easy' | 'even' | 'deadly';

export function getLevelGap(encounterLevel: number): LevelGap {
  const gap = encounterLevel - getLevel();
  if (gap <= -3) return 'trivial';
  if (gap < 0) return 'easy';
  if (gap <= 1) return 'even';
  return 'deadly';
}

// Combat mechanics (attack/investigate/pet resolution) live in
// combatEngine.ts's runCombatTick() - this only declares what happens next
// once an encounter is dead: drop it, and if nothing was queued behind it,
// decide and spawn a fresh one.
export function tick() {
  runCombatTick();

  const encounter = getEncounter();
  const now = Date.now();

  if (encounter.status === 'dead' && encounter.diedAt !== null && now - encounter.diedAt >= ENCOUNTER_END_MS) {
    // Reset the shared mutex before the next encounter's kind takes over.
    setActionIdle();
    // Anything paused behind the dropped encounter becomes the new front
    // automatically. Only decide something fresh if nothing's left.
    dropEncounter();
    if (!hasEncounter()) {
      const next = decideNextEncounter(encounter.id as EncounterId);
      journal.encounterSpawned(next.id);
      interruptEncounter(next);
    }
  }
}

// Priority: an active spawn-freeze replays the encounter that just died;
// otherwise an eligible event; otherwise the normal zone pick. diedId is
// passed explicitly since the dying encounter is already dropped from the
// queue by the time this runs.
function decideNextEncounter(diedId: EncounterId): Encounter {
  if (isEffectActive('freezeSpawn')) return createEncounter(diedId);
  const eventEncounterId = shouldShowEvent();
  if (eventEncounterId) return createEncounter(eventEncounterId);
  const zoneId = getCurrentZoneId();
  return createEncounter(pickEncounter(zoneId));
}

export function useItem(itemId: ItemId) {
  const action = (ITEMS[itemId] as ItemDef).action;
  if (!action) return;
  // Fires before triggerEffect() - immediate feedback the click registered,
  // independent of what the effect does.
  playSound('ItemUsed');
  // effect.svelte.ts's launchEncounter case interrupts directly, so
  // comparing instanceId before/after is how a launched encounter is
  // detected here to log it.
  const before = getEncounter().instanceId;
  triggerEffect(action.effect);
  if (action.consumes) removeItem(itemId, 1);
  const after = getEncounter();
  if (after.instanceId !== before) journal.encounterSpawned(after.id);
}

// Dialog resolution (resolveDialogChoice/dismissDialog/getVisibleDialogChoices/
// getDialogSayLines) lives in dialogEngine.ts - same composition-layer role
// as this file, split out because it's a fully self-contained cluster that
// shares no logic with the encounter-lifecycle/item code here. Re-exported
// through game.ts alongside everything else, so the "one seam" rule holds.
