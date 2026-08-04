<script lang="ts">
  import { getEncounter } from '../game/game';
  import MonsterCard from './MonsterCard.svelte';
  import InvestigationCard from './InvestigationCard.svelte';
  import SocialCard from './SocialCard.svelte';
  import CrossroadCard from './CrossroadCard.svelte';
  import AttackMeter from './AttackMeter.svelte';
  import InvestigationMeter from './InvestigationMeter.svelte';
  import FloatingText from './FloatingText.svelte';

  let encounter = $derived(getEncounter());
</script>

<div class="encounter-slot">
  {#if encounter.action === 'attack'}
    <MonsterCard />
    <FloatingText />
    <AttackMeter />
  {:else if encounter.action === 'investigate'}
    <InvestigationCard />
    <FloatingText />
    <InvestigationMeter />
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
