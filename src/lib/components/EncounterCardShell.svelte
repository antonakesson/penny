<script lang="ts">
  import type { Snippet } from 'svelte';
  import Discovery from './Discovery.svelte';
  import type { Encounter } from '../game/types';

  // Shell only - the .encounter/.header/.name/.level chrome shared by every
  // card kind (monster/investigation/rabbidSquirrel). Kind-specific body
  // (hp bar, resolve button, whatever the next kind needs) is the children
  // snippet; only Investigation lacks a level to show.
  let { encounter, children }: { encounter: Encounter; children: Snippet } = $props();
</script>

<section class="encounter" class:done={encounter.status === 'dead'}>
  <Discovery monster={encounter}>
    <div class="header">
      <h3 class="name">{encounter.name}</h3>
      {#if encounter.action !== 'investigate'}<span class="level">Lv. {encounter.level}</span>{/if}
    </div>
  </Discovery>
  {@render children()}
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
</style>
