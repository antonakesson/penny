<script lang="ts">
  import type { Snippet } from 'svelte';
  import { isDiscoveryVisible } from '../game/game';
  import { MONSTERS, type MonsterId, type MonsterDef } from '../game/data/monstats';
  import type { Monster } from '../game/types';

  let { monster, children }: { monster: Monster; children: Snippet } = $props();

  let visible = $derived(isDiscoveryVisible(monster.isNewDiscovery));
  let entryLabel = $derived(`Entry No. ${String(monster.entryNo).padStart(3, '0')}`);
  let description = $derived((MONSTERS[monster.id as MonsterId] as MonsterDef).description);
</script>

{#if visible}
  <p class="entry-no">{entryLabel}</p>
{/if}
{@render children()}
{#if visible && description}
  <p class="description">{description}</p>
{/if}

<style>
  .entry-no {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
    animation: stamp-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .description {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
    margin: 0 0 12px;
    animation: reveal-fade 0.4s ease-out both;
    animation-delay: 0.15s;
  }

  @keyframes stamp-in {
    0% {
      opacity: 0;
      transform: scale(1.7);
      text-shadow: 0 0 22px var(--rarity-legendary);
    }
    55% {
      opacity: 1;
      transform: scale(0.94);
    }
    100% {
      opacity: 1;
      transform: scale(1);
      text-shadow: 0 0 0 var(--rarity-legendary);
    }
  }
  @keyframes reveal-fade {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
