import { getEncounter, killMonster } from './state/encounter.svelte';
import { switchZone } from './state/zone.svelte';
import { advance, setDistance } from './state/map.svelte';
import { isEffectActive } from './state/effect.svelte';
import { evaluateCondition } from './condition';
import type { CrossroadBranch } from './data/encounters';
import * as journal from './journal';

// <CrossroadCard/> calls this instead of reading def.branches directly, so a
// gated branch (e.g. one that only opens once some item/flag is in hand) is
// genuinely absent rather than rendered disabled - same rule as
// dialogEngine.ts's getVisibleDialogChoices().
export function getVisibleCrossroadBranches(branches: readonly CrossroadBranch[]): readonly CrossroadBranch[] {
  return branches.filter((b) => !b.when || evaluateCondition(b.when));
}

// 'continue' is never authored on a CrossroadDef - staying on the current
// path is always available, <CrossroadCard/> renders it unconditionally
// alongside whatever branches are declared. Takes the whole branch (not
// just its destination) - same shape as dialogEngine.ts's
// resolveDialogChoice(choice: DialogChoice) - since entryDistance has to
// travel with it: a branch always lands at an exact authored point in the
// destination zone, never wherever that zone's distance last happened to be.
export function resolveCrossroadChoice(choice: CrossroadBranch | 'continue') {
  const encounter = getEncounter();
  if (encounter.action !== 'crossroad' || encounter.status !== 'active') return;
  if (choice === 'continue') {
    killMonster();
    if (!isEffectActive('freezeSpawn')) advance();
  } else {
    switchZone(choice.destination);
    setDistance(choice.entryDistance);
    killMonster();
  }
  journal.encounterCompleted(encounter.id);
}
