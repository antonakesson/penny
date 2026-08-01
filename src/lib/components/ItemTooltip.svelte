<script lang="ts">
  import { ITEMS, ITEM_CAP, type ItemDef } from '../game/data/loot';
  import { EFFECTS } from '../game/data/effects';
  import { getTooltip, hideTooltip } from '../ui/tooltip.svelte';

  const HALF_WIDTH = 110;
  const MARGIN = 8;

  let tooltip = $derived(getTooltip());
  let item = $derived(tooltip ? (ITEMS[tooltip.itemId] as ItemDef) : null);
  // Derived straight off ITEM_CAP, not a separate authored flag - "unique"
  // here means the same thing the cap does (can never exceed one), so
  // there's exactly one source of truth for it.
  let isUnique = $derived(tooltip ? ITEM_CAP[tooltip.itemId] === 1 : false);

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
    {#if isUnique}<p class="unique-tag">Unique</p>{/if}
    <p class="tooltip-name">{item.name}</p>
    {#if item.flavor}
      <p class="tooltip-flavor">{item.flavor}</p>
    {/if}
    {#if item.action}
      <p class="tooltip-action">{EFFECTS[item.action.effect].description}</p>
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
    border: 1px solid var(--tier, var(--border));
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
    margin: 0 6px 6px 0;
  }
  .unique-tag {
    display: inline-block;
    font: 700 10px/1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-faint);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 7px;
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

  /* Legendary: same glow as the Style Codex item-card mockup. The Codex's
     own "runs off the tooltip" gag (name set nowrap/overflow-visible) reads
     fine in an isolated mockup but breaks for real in this fixed-position
     tooltip next to other panes — a long legendary name just runs straight
     through neighboring UI instead of spilling harmlessly. Wraps instead. */
  .tooltip.legendary {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), 0 2px 12px var(--shadow);
  }
  .tooltip.legendary .tooltip-name {
    color: var(--accent-text);
  }
</style>
