<script lang="ts">
  import { ITEMS, type ItemId, type ItemDef } from '../game/data/loot';
  import { showTooltip, hideTooltip } from '../ui/tooltip.svelte';

  let { id, qty }: { id: ItemId; qty: number } = $props();
  let item = $derived(ITEMS[id] as ItemDef);
  let tileEl: HTMLElement;

  function show() {
    showTooltip(id, tileEl.getBoundingClientRect());
  }
</script>

<div
  class="item-tile"
  class:legendary={item.rarity === 'legendary'}
  style="--tier: var(--rarity-{item.rarity})"
  tabindex="0"
  bind:this={tileEl}
  onpointerenter={show}
  onpointerleave={hideTooltip}
  onfocus={show}
  onblur={hideTooltip}
>
  <span class="qty-badge">×{qty}</span>
  <span class="tile-name">{item.name}</span>
</div>

<style>
  .item-tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 8px;
    border: 1px solid var(--tier, var(--border));
    border-radius: 6px;
    background: var(--page);
    text-align: center;
    cursor: default;
  }
  .item-tile:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .qty-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    font: 700 11px/1 var(--font-ui);
    background: var(--page-raised);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 6px;
  }
  .tile-name {
    font: 600 13px/1.3 var(--font-ui);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
