<script lang="ts">
  import { getWelcomeBack, clearWelcomeBack } from '../game/game';
  import { ITEMS, type ItemId } from '../game/data/loot';

  const DISMISS_MS = 7000;

  let summary = $derived(getWelcomeBack());

  $effect(() => {
    if (!summary) return;
    const id = setTimeout(clearWelcomeBack, DISMISS_MS);
    return () => clearTimeout(id);
  });
</script>

{#if summary}
  <div class="welcome-back">
    <button class="dismiss" onclick={clearWelcomeBack} aria-label="Dismiss">×</button>
    <p class="headline">While you were away</p>
    <p class="line">{summary.kills} monster{summary.kills === 1 ? '' : 's'} defeated · +{summary.xpGained} xp</p>
    {#if Object.keys(summary.itemsGained).length > 0}
      <p class="line items">
        {#each Object.entries(summary.itemsGained) as [id, qty], i (id)}
          {i > 0 ? ', ' : ''}+{qty} {ITEMS[id as ItemId].name}
        {/each}
      </p>
    {/if}
  </div>
{/if}

<style>
  .welcome-back {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    max-width: min(90vw, 360px);
    background: var(--page-raised);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 36px 14px 18px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  .headline {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin: 0 0 6px;
  }
  .line {
    font: 400 13px/1.4 var(--font-ui);
    color: var(--ink-faint);
    margin: 0;
  }
  .items {
    margin-top: 2px;
  }
  .dismiss {
    position: absolute;
    top: 8px;
    right: 10px;
    background: none;
    border: none;
    font-size: 16px;
    line-height: 1;
    color: var(--ink-faint);
    padding: 4px;
  }
</style>
