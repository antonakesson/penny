<script lang="ts">
  import { getEncounter, resolveRabbidSquirrelPick } from '../game/game';
  import EncounterCardShell from './EncounterCardShell.svelte';
  import type { RabbidSquirrel } from '../game/types';

  // Placeholder plumbing only - real Bribe/Shoo choices land with the
  // Recruit Pet follow-up. The button IS the interaction; no meter mounts
  // alongside this card.
  let encounter = $derived(getEncounter() as RabbidSquirrel);
</script>

<EncounterCardShell {encounter}>
  <button
    class="resolve"
    disabled={encounter.status !== 'active'}
    onclick={resolveRabbidSquirrelPick}
  >
    Move on
  </button>
</EncounterCardShell>

<style>
  .resolve {
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--wax-on);
    background: var(--wax);
    border: 1px solid var(--wax);
    border-radius: 6px;
    padding: 10px 14px;
    cursor: pointer;
  }
  .resolve:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
