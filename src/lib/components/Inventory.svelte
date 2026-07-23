<script lang="ts">
  import { getInventory } from '../game/game';
  import { ITEMS, RARITY_ORDER, type ItemId } from '../game/data/loot';
  import ItemTile from './ItemTile.svelte';

  let entries = $derived(Object.entries(getInventory()) as [ItemId, number][]);
  let sorted = $derived(
    [...entries].sort((a, b) => RARITY_ORDER.indexOf(ITEMS[a[0]].rarity) - RARITY_ORDER.indexOf(ITEMS[b[0]].rarity))
  );
</script>

{#if sorted.length === 0}
  <p class="empty">Nothing here yet. Go hit something.</p>
{:else}
  <div class="item-grid">
    {#each sorted as [id, qty] (id)}
      <ItemTile {id} {qty} />
    {/each}
  </div>
{/if}

<style>
  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }
  .empty {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
    margin: 0;
  }
</style>
