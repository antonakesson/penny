<script lang="ts">
  import { isFeatureUnlocked } from '../game/game';

  // Reads the same unlock flag that gates the Pet pane - no pet-identity
  // state exists yet (see [[architecture_state_ownership]]: no state
  // module until there's an actual slice to own), so this is hardcoded to
  // the one pet that can currently be recruited. Swap for a real name/
  // level readout once state/pet.svelte.ts exists.
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
