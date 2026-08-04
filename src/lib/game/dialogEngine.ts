import {
  getEncounter,
  killMonster,
  pickDialogChoice,
  setCharacterName,
} from './state/encounter.svelte';
import { getDialogNode, type DialogNode, type DialogChoice } from './data/dialog';
import { CHARACTERS } from './data/characters';
import { evaluateCondition } from './condition';
import { advance } from './state/map.svelte';
import { triggerEffect, isEffectActive } from './state/effect.svelte';
import * as journal from './journal';

// <SocialCard/> calls this instead of reading node.choices directly, so a
// gated or already-picked one-shot choice is genuinely absent (no index, no
// keybind) rather than rendered disabled.
export function getVisibleDialogChoices(node: DialogNode): readonly DialogChoice[] {
  if (!node.choices) return [];
  const encounter = getEncounter();
  const visited = encounter.action === 'social' ? encounter.visitedChoiceIds : [];
  return node.choices.filter(
    (choice) =>
      (!choice.when || evaluateCondition(choice.when)) &&
      (!choice.uniqueId || !visited.includes(choice.uniqueId)),
  );
}

// <SocialCard/> calls this instead of reading node.lines directly - it
// resolves each 'say' line's speaker to a display name (CHARACTERS' default,
// overridden by any 'rename' line already processed for this encounter) and
// drops 'action'/'rename' lines, which are silent. Renames are applied once
// on node arrival (see resolveDialogChoice() below), so a node that both
// renames a character and has that character speak always renders with the
// post-rename name - there's no line-by-line temporal cursor since all of a
// node's lines display at once.
export function getDialogSayLines(node: DialogNode): { speaker: string; text: string }[] {
  const encounter = getEncounter();
  const overrides = encounter.action === 'social' ? encounter.nameOverrides : {};
  return node.lines
    .filter((line) => line.kind === 'say')
    .map((line) => ({
      speaker: line.speaker === 'narrator' ? 'Narrator' : (overrides[line.speaker] ?? CHARACTERS[line.speaker]),
      text: line.text,
    }));
}

// Reaching a terminal node (no choices of its own) does NOT resolve the
// encounter here - a dialog's last line is real prose the player still
// needs to read. See dismissDialog() below for the actual resolution.
export function resolveDialogChoice(choice: DialogChoice) {
  const encounter = getEncounter();
  if (encounter.action !== 'social' || encounter.status !== 'active') return;
  const next = choice.next;
  pickDialogChoice(next, choice.uniqueId);
  const node = getDialogNode(next);
  for (const line of node.lines) {
    if (line.kind === 'action') triggerEffect(line.effect);
    else if (line.kind === 'rename') setCharacterName(line.character, line.name);
  }
  journal.dialogNode(next);
}

// No journal.encounterCompleted() here unlike resolveKill() (engine.ts) - a
// conversation's ending is already narrated by whichever node it stopped
// on, each already logged via resolveDialogChoice.
export function dismissDialog() {
  const encounter = getEncounter();
  if (encounter.action !== 'social' || encounter.status !== 'active') return;
  const node = getDialogNode(encounter.currentNode);
  if (node.choices && node.choices.length > 0) return;
  killMonster();
  if (!isEffectActive('freezeSpawn')) advance();
}
