<script lang="ts">
  import type { Snippet } from 'svelte';
  import { isDiscoveryVisible } from '../game/game';
  import { getBestiaryEntry } from '../game/data/bestiary';
  import {
    ENCOUNTERS,
    type EncounterId,
    type MonsterDef,
    type InvestigationDef,
    type RabbidSquirrelDef,
  } from '../game/data/encounters';
  import type { Encounter } from '../game/types';

  let { monster, children }: { monster: Encounter; children: Snippet } = $props();

  // Only bestiary-listed encounters get an entry-no chip - a one-shot event
  // or unfinished placeholder has no BestiaryEntry to number it with.
  let entryNo = $derived(getBestiaryEntry(monster.name)?.entryNo);
  let visible = $derived(entryNo !== undefined && isDiscoveryVisible(monster.isNewDiscovery));
  let entryLabel = $derived(`Entry No. ${String(entryNo).padStart(3, '0')}`);

  // The encounter's own flavor text - shown every time it's live, not
  // gated on Bestiary discovery (that's a separate, sparser note the
  // Bestiary keeps for itself - see data/bestiary.ts). Investigation kinds
  // walk through a beats array as progress advances instead of showing one
  // static blurb for the whole hold - see InvestigationDef.descriptions.
  let description = $derived.by(() => {
    if (monster.action === 'investigate') {
      const beats = (ENCOUNTERS[monster.id as EncounterId] as InvestigationDef).descriptions;
      if (!beats || beats.length === 0) return undefined;
      const progress = 1 - monster.hp / monster.maxHp;
      const index = Math.min(beats.length - 1, Math.floor(progress * beats.length));
      return beats[index];
    }
    return (ENCOUNTERS[monster.id as EncounterId] as MonsterDef | RabbidSquirrelDef).description;
  });
</script>

{#if visible}
  <p class="entry-no">{entryLabel}</p>
{/if}
{@render children()}
{#if description}
  {#key description}
    <p class="description">{description}</p>
  {/key}
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
