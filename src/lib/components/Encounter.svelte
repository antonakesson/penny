<script lang="ts">
  import Monster from './Monster.svelte';
  import FloatingText from './FloatingText.svelte';
</script>

<div class="encounter-slot">
  <Monster />
  <FloatingText />
</div>

<style>
  .encounter-slot {
    position: relative;
  }
</style>
