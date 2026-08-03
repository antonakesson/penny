<script lang="ts">
  import { getEncounter, resolveDialogChoice, getVisibleDialogChoices, dismissDialog } from '../game/game';
  import { getDialogNode } from '../game/data/dialog';
  import EncounterCardShell from './EncounterCardShell.svelte';
  import type { Social } from '../game/types';

  let encounter = $derived(getEncounter() as Social);
  let node = $derived(getDialogNode(encounter.currentNode));
  // Gated choices (see DialogChoice.when) are filtered out here, not just
  // hidden in the markup - so a gated option gets neither a digit keybind
  // nor a rendered index for the one after it to shift into.
  let choices = $derived(getVisibleDialogChoices(node));

  // Digit keys 1-9 pick the matching choice, mirroring the click handler
  // below - reads encounter/node live at keypress time rather than at
  // effect-setup time, so this doesn't need to re-register as the
  // conversation advances. Ignored while a text input has focus (DevTools'
  // seed/qty fields, etc.) so typing a digit there doesn't also fire a
  // dialog choice.
  $effect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (encounter.status !== 'active' || choices.length === 0) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= choices.length) return;
      resolveDialogChoice(choices[index].next);
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

<EncounterCardShell {encounter}>
  {#key encounter.currentNode}
    <p class="line">{node.text}</p>
  {/key}
  {#if choices.length > 0}
    <div class="choices">
      {#each choices as choice, i}
        <button
          class="choice"
          disabled={encounter.status !== 'active'}
          onclick={() => resolveDialogChoice(choice.next)}
        >
          <span class="choice-num">{i + 1}.</span>
          {choice.text}
        </button>
      {/each}
    </div>
  {:else if !node.choices?.length}
    <div class="choices">
      <button class="choice" disabled={encounter.status !== 'active'} onclick={() => dismissDialog()}>
        Continue.
      </button>
    </div>
  {/if}
</EncounterCardShell>

<style>
  .line {
    font-family: var(--font-body);
    color: var(--ink-strong);
    margin: 0 0 12px;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .choice {
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--wax-on);
    background: var(--wax);
    border: 1px solid var(--wax);
    border-radius: 6px;
    padding: 10px 14px;
    cursor: pointer;
    text-align: left;
  }
  .choice:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .choice-num {
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
  }
</style>
