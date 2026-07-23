<script lang="ts">
  import { ITEMS, type ItemId } from '../game/data/loot';

  let { id, qty }: { id: ItemId; qty: number } = $props();
  let item = $derived(ITEMS[id]);
</script>

<div
  class="item-tile"
  class:legendary={item.rarity === 'legendary'}
  style="--tier: var(--rarity-{item.rarity})"
  tabindex="0"
>
  <span class="qty-badge">×{qty}</span>
  <span class="tile-name">{item.name}</span>

  <div class="tooltip" role="tooltip">
    <p class="rarity-tag">{item.rarity}</p>
    <p class="tooltip-name">{item.name}</p>
    <!-- No stat block yet — items have no stats. A future one would go
         here, flat/boring regardless of rarity, per the style codex. -->
    <p class="tooltip-flavor">{item.flavor}</p>
  </div>
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

  .tooltip {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 160px;
    max-width: 220px;
    padding: 10px 12px;
    text-align: left;
    background: var(--page-raised);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 16px var(--shadow);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.12s ease;
    z-index: 10;
  }
  .item-tile:hover .tooltip,
  .item-tile:focus-within .tooltip {
    opacity: 1;
    visibility: visible;
  }
  .rarity-tag {
    display: inline-block;
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent-on);
    background: var(--tier);
    border-radius: 999px;
    padding: 3px 8px;
    margin: 0 0 6px;
  }
  .tooltip-name {
    font: 700 14px/1.3 var(--font-structural);
    margin: 4px 0;
  }
  .tooltip-flavor {
    font: 400 13px/1.4 var(--font-body);
    color: var(--ink-faint);
    margin: 0;
  }

  /* Legendary: same glow as the Style Codex item-card mockup, plus the
     "runs off the tooltip" gag — the name goes nowrap/overflow-visible so
     it spills past the box instead of wrapping or truncating. */
  .item-tile.legendary .tooltip {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), 0 2px 12px var(--shadow);
  }
  .item-tile.legendary .tooltip-name {
    white-space: nowrap;
    overflow: visible;
  }
</style>
