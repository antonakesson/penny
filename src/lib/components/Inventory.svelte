<script lang="ts">
  import { getInventory } from '../game/game';
  import { ITEMS, RARITY_ORDER, type ItemId } from '../game/data/loot';
  import ItemTile from './ItemTile.svelte';

  let entries = $derived(Object.entries(getInventory()) as [ItemId, number][]);
  // Grouped by rarity rather than one flat sorted list, so each tier reads
  // as its own shelf - a tier with nothing in it renders no header at all.
  let tiers = $derived(
    RARITY_ORDER.map((rarity) => [rarity, entries.filter(([id]) => ITEMS[id].rarity === rarity)] as const).filter(
      ([, items]) => items.length > 0
    )
  );
</script>

{#if tiers.length === 0}
  <p class="empty">Nothing here yet. Go hit something.</p>
{:else}
  {#each tiers as [rarity, items] (rarity)}
    <div class="tier">
      <p class="tier-label" style="color: var(--rarity-{rarity})">{rarity}</p>
      <div class="item-grid">
        {#each items as [id, qty] (id)}
          <ItemTile {id} {qty} />
        {/each}
      </div>
    </div>
  {/each}
{/if}

<style>
  .tier + .tier {
    margin-top: 18px;
  }
  .tier-label {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
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
