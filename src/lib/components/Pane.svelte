<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getActivePane, isPinned, getPinOrder, togglePin, type PaneId } from '../ui/panes.svelte';

  let { paneId, label, children }: { paneId: PaneId; label: string; children: Snippet } = $props();
  let open = $derived(getActivePane() === paneId);
  let pinned = $derived(isPinned(paneId));
  // Offset by 1 so a pinned pane's flex order never ties with combat's
  // (unset, defaults to 0).
  let dockOrder = $derived(getPinOrder(paneId) + 1);
</script>

<aside class="pane" class:open class:pinned style="order: {dockOrder}">
  <div class="pane-header">
    <p class="pane-title">{label}</p>
    <button
      class="pin-toggle"
      class:active={pinned}
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
      onclick={() => togglePin(paneId)}
    >
      📌
    </button>
  </div>
  {@render children()}
</aside>

<style>
  .pane {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 56px;
    height: 60vh;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: var(--page-raised);
    border-top: 1px solid var(--border);
    border-radius: 12px 12px 0 0;
    padding: 18px 20px 20px;
    box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.16);
    transform: translateY(110%);
    transition: transform 0.2s ease;
    z-index: 2;
  }
  .pane.open {
    transform: translateY(0);
  }
  .pane-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
    margin: 0 0 10px;
  }
  .pane-title {
    font: 700 12px/1 var(--font-ui);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0;
  }
  .pin-toggle {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .pane {
      transition: none;
    }
  }

  @media (min-width: 900px) {
    .pane {
      left: auto;
      right: 0;
      top: 0;
      bottom: 0;
      width: 320px;
      height: auto;
      border-top: none;
      border-left: 1px solid var(--border);
      border-radius: 0;
      box-shadow: -8px 0 20px var(--shadow);
      transform: translateX(110%);
    }
    .pane.open {
      transform: translateX(0);
    }
    /* Pinned overrides open/closed entirely - docks as a static flex column. */
    .pane.pinned {
      position: static;
      transform: none !important;
      flex: 0 0 320px;
      box-shadow: none;
    }
    .pin-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      font-size: 13px;
      line-height: 1;
      color: var(--ink-faint);
      background: none;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0;
      opacity: 0.6;
      transform: rotate(45deg);
    }
    .pin-toggle.active {
      color: var(--accent-text);
      border-color: var(--accent);
      opacity: 1;
      transform: none;
    }
  }
</style>
