<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    ENCOUNTERS,
    type EncounterId,
    type MonsterDef,
    type InvestigationDef,
    type SocialDef,
  } from '../game/data/encounters';
  import type { Encounter } from '../game/types';

  let { monster, children }: { monster: Encounter; children: Snippet } = $props();

  // The encounter's own flavor text - shown every time it's live. Used to
  // sit alongside a Bestiary "Entry No." discovery chip here too; that
  // mechanic's been pulled (see data/journal.ts) and this component is
  // pending a rename/repurpose once the Journal has its own UI home.
  // Investigation kinds walk through a beats array as progress advances
  // instead of showing one static blurb for the whole hold - see
  // InvestigationDef.descriptions.
  let description = $derived.by(() => {
    if (monster.action === 'investigate') {
      const beats = (ENCOUNTERS[monster.id as EncounterId] as InvestigationDef).descriptions;
      if (!beats || beats.length === 0) return undefined;
      const progress = 1 - monster.hp / monster.maxHp;
      const index = Math.min(beats.length - 1, Math.floor(progress * beats.length));
      return beats[index];
    }
    return (ENCOUNTERS[monster.id as EncounterId] as MonsterDef | SocialDef).description;
  });
</script>

{@render children()}
{#if description}
  {#key description}
    <p class="description">{description}</p>
  {/key}
{/if}

<style>
  .description {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
    margin: 0 0 12px;
    animation: reveal-fade 0.4s ease-out both;
    animation-delay: 0.15s;
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
