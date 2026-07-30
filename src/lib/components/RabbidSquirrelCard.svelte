<script lang="ts">
  import { getEncounter, resolveRabbidSquirrelPick } from '../game/game';
  import Discovery from './Discovery.svelte';
  import type { RabbidSquirrel } from '../game/types';

  // Placeholder plumbing only - real Bribe/Shoo choices land with the
  // Recruit Pet follow-up. The button IS the interaction; no meter mounts
  // alongside this card.
  let encounter = $derived(getEncounter() as RabbidSquirrel);
</script>

<section class="encounter" class:done={encounter.status === 'dead'}>
  <Discovery monster={encounter}>
    <div class="header">
      <h3 class="name">{encounter.name}</h3>
      <span class="level">Lv. {encounter.level}</span>
    </div>
  </Discovery>
  <button
    class="resolve"
    disabled={encounter.status !== 'active'}
    onclick={resolveRabbidSquirrelPick}
  >
    Move on
  </button>
</section>

<style>
  .encounter {
    margin-bottom: 20px;
    max-width: 340px;
    opacity: 1;
    transition: opacity 0.3s ease-out;
  }
  .encounter.done {
    opacity: 0.4;
  }
  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .name {
    font: 700 20px/1.2 var(--font-structural);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink-strong);
    margin: 0;
  }
  .level {
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-faint);
    white-space: nowrap;
  }
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
