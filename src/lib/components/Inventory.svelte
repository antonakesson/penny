<script lang="ts">
  import { getInventory } from '../game/game';
</script>

<span>
  {#each Object.entries(getInventory()) as [id, qty]}
    {id} x{qty}
  {/each}
</span>
