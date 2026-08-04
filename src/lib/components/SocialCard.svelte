<script lang="ts">
  import { getEncounter, resolveDialogChoice, getVisibleDialogChoices, getDialogSayLines } from '../game/game';
  import { getDialogNode } from '../game/data/dialog';
  import EncounterCardShell from './EncounterCardShell.svelte';
  import type { Social } from '../game/types';

  let encounter = $derived(getEncounter() as Social);
  let node = $derived(getDialogNode(encounter.currentNode));
  let lines = $derived(getDialogSayLines(node));
  // Gated choices are filtered out here, not just hidden - so a gated
  // option gets neither a digit keybind nor a rendered index.
  let choices = $derived(getVisibleDialogChoices(node));

  // Ignored while a text input has focus, so typing a digit elsewhere
  // (DevTools' fields) doesn't also fire a dialog choice.
  $effect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (encounter.status !== 'active' || choices.length === 0) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= choices.length) return;
      resolveDialogChoice(choices[index]);
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

<EncounterCardShell {encounter}>
  {#key encounter.currentNode}
    <div class="lines">
      {#each lines as line}
        <p class="line">
          {#if line.speaker !== 'Narrator'}<span class="speaker">{line.speaker}</span>{/if}
          {line.text}
        </p>
      {/each}
    </div>
  {/key}
  {#if choices.length > 0}
    <div class="choices">
      {#each choices as choice, i}
        <button
          class="choice"
          disabled={encounter.status !== 'active'}
          onclick={() => resolveDialogChoice(choice)}
        >
          <span class="choice-num">{i + 1}.</span>
          {choice.text}
        </button>
      {/each}
    </div>
  {:else if !node.choices?.length && encounter.status === 'active'}
    <p class="continue-hint">Click to continue.</p>
  {/if}
</EncounterCardShell>

<style>
  .lines {
    margin: 0 0 12px;
  }
  .line {
    font-family: var(--font-body);
    color: var(--ink-strong);
    margin: 0 0 6px;
  }
  .speaker {
    font: 700 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin-right: 6px;
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
  .continue-hint {
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    font-style: italic;
    color: var(--ink-faint);
    margin: 0;
  }
</style>
