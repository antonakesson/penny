<script lang="ts">
  import { getEncounter } from '../game/game';
  import MonsterCard from './MonsterCard.svelte';
  import InvestigationCard from './InvestigationCard.svelte';
  import SocialCard from './SocialCard.svelte';
  import CrossroadCard from './CrossroadCard.svelte';
  import CastBar from './CastBar.svelte';
  import FloatingText from './FloatingText.svelte';

  let encounter = $derived(getEncounter());
</script>

<div class="encounter-slot">
  {#if encounter.action === 'attack'}
    <MonsterCard />
    <FloatingText />
    <CastBar idleSkill="attack" />
  {:else if encounter.action === 'investigate'}
    <InvestigationCard />
    <FloatingText />
    <CastBar idleSkill="investigate" />
  {:else if encounter.action === 'social'}
    <SocialCard />
  {:else}
    <CrossroadCard />
  {/if}
</div>

<style>
  .encounter-slot {
    position: relative;
  }
</style>
