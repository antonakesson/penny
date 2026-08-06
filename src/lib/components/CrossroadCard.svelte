<script lang="ts">
  import { getEncounter, resolveCrossroadChoice, getVisibleCrossroadBranches } from '../game/game';
  import EncounterCardShell from './EncounterCardShell.svelte';
  import { createChoiceSettle } from '../ui/choiceSettle.svelte';
  import type { Crossroad } from '../game/types';

  let encounter = $derived(getEncounter() as Crossroad);
  let branches = $derived(getVisibleCrossroadBranches(encounter.branches));
  // A crossroad's branches never change mid-encounter, so the instance is
  // the only thing that re-arms the window.
  let settle = createChoiceSettle(() => encounter.instanceId);
  let ready = $derived(encounter.status === 'active' && settle.settled);
</script>

<EncounterCardShell {encounter}>
  <div class="fork">
    {#each branches as branch}
      <button
        class="branch"
        disabled={!ready}
        onclick={() => resolveCrossroadChoice(branch)}
      >
        {branch.label}
      </button>
    {/each}
  </div>
  <button class="continue" disabled={!ready} onclick={() => resolveCrossroadChoice('continue')}>
    Stay the course
  </button>
</EncounterCardShell>

<style>
  /* Deliberately not SocialCard's vertical numbered list - a crossroad is a
     fork to look at, not a line of dialogue to read down through. */
  .fork {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 14px;
  }
  .branch {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-text);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 10px 18px;
    cursor: pointer;
  }
  .branch::before {
    content: '◆ ';
    color: var(--accent);
  }
  .branch:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .continue {
    display: block;
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    font-style: italic;
    color: var(--ink-faint);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .continue:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
