<script lang="ts">
  import type { Snippet } from 'svelte';
  import Flavortext from './Flavortext.svelte';
  import { getLevelGap } from '../game/game';
  import type { Encounter } from '../game/types';
  import { ENCOUNTER_ICONS } from '../game/data/icons';
  import type { EncounterId } from '../game/data/encounters';

  let { encounter, children }: { encounter: Encounter; children: Snippet } = $props();

  // Only attack/social carry a `level` field - narrowed once here.
  let level = $derived(encounter.action === 'attack' || encounter.action === 'social' ? encounter.level : null);
  let levelGap = $derived(level !== null ? getLevelGap(level) : null);
  let icon = $derived(ENCOUNTER_ICONS[encounter.id as EncounterId]);
</script>

<section class="encounter" class:done={encounter.status === 'dead'}>
  <Flavortext {encounter}>
    <div class="header">
      <h3 class="name">{#if icon}<span class="icon">{icon}</span>{/if}{encounter.name}</h3>
      {#if levelGap}<span class="level {levelGap}">Lv. {level}</span>{/if}
    </div>
  </Flavortext>
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
  .icon {
    margin-right: 6px;
  }
  .level {
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-faint);
    white-space: nowrap;
  }
  /* Reuses the rarity/wax palette instead of inventing new colors. */
  .level.trivial {
    color: var(--rarity-common);
  }
  .level.easy {
    color: var(--rarity-uncommon);
  }
  .level.even {
    color: var(--accent-text);
  }
  .level.deadly {
    color: var(--wax);
  }
</style>
