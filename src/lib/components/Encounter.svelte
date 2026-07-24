<script lang="ts">
  import { getEncounter } from '../game/game';
  import Monster from './Monster.svelte';
  import Treasure from './Treasure.svelte';
  import RecruitEvent from './RecruitEvent.svelte';
  import FloatingText from './FloatingText.svelte';

  let encounter = $derived(getEncounter());
</script>

<div class="encounter-slot">
  {#if encounter.kind === 'monster'}
    <Monster />
  {:else if encounter.kind === 'treasure'}
    <Treasure />
  {:else}
    <RecruitEvent />
  {/if}
  <FloatingText />
</div>

<style>
  .encounter-slot {
    position: relative;
  }
</style>
