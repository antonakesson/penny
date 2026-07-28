<script lang="ts">
  import { ITEMS, type ItemDef } from '../game/data/loot';
  import { ITEM_ACTIONS } from '../game/data/itemActions';
  import { getTooltip, hideTooltip } from '../ui/tooltip.svelte';

  const HALF_WIDTH = 110;
  const MARGIN = 8;

  let tooltip = $derived(getTooltip());
  let item = $derived(tooltip ? (ITEMS[tooltip.itemId] as ItemDef) : null);

  let top = $derived(tooltip ? tooltip.rect.bottom + MARGIN : 0);
  let left = $derived(
    tooltip
      ? Math.min(
          Math.max(tooltip.rect.left + tooltip.rect.width / 2, HALF_WIDTH + MARGIN),
          window.innerWidth - HALF_WIDTH - MARGIN
        )
      : 0
  );

  // The pane that hosts the item scrolls internally; once it moves, the
  // captured bounding rect is stale, so drop the tooltip rather than have
  // it float over the wrong item.
  $effect(() => {
    if (!tooltip) return;
    window.addEventListener('scroll', hideTooltip, { capture: true });
    return () => window.removeEventListener('scroll', hideTooltip, { capture: true });
  });
</script>

{#if tooltip && item}
  <div
    class="tooltip"
    class:legendary={item.rarity === 'legendary'}
    style="--tier: var(--rarity-{item.rarity}); top: {top}px; left: {left}px;"
    role="tooltip"
  >
    <p class="rarity-tag">{item.rarity}</p>
    <p class="tooltip-name">{item.name}</p>
    <p class="tooltip-flavor">{item.flavor}</p>
    {#if item.action}
      <p class="tooltip-action">{ITEM_ACTIONS[item.action].description}</p>
    {/if}
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    transform: translateX(-50%);
    min-width: 160px;
    max-width: 220px;
    padding: 10px 12px;
    text-align: left;
    background: var(--page-raised);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 4px 16px var(--shadow);
    pointer-events: none;
    z-index: 100;
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
  .tooltip-action {
    font: 600 12px/1.4 var(--font-ui);
    color: var(--accent-text);
    margin: 8px 0 0;
  }

  /* Legendary: same glow as the Style Codex item-card mockup, plus the
     "runs off the tooltip" gag — the name goes nowrap/overflow-visible so
     it spills past the box instead of wrapping or truncating. */
  .tooltip.legendary {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), 0 2px 12px var(--shadow);
  }
  .tooltip.legendary .tooltip-name {
    white-space: nowrap;
    overflow: visible;
  }
</style>
