<script lang="ts">
  import { isFeatureUnlocked } from '../game/game';

  // No pet-identity state yet, so hardcoded to the one recruitable pet.
  let recruited = $derived(isFeatureUnlocked('pet'));
</script>

{#if recruited}
  <p class="pet-status">Your squirrel keeps pace nearby.</p>
{/if}

<style>
  .pet-status {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
    margin: 16px 0 0;
  }
</style>
