<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getActivePane, type PaneId } from '../ui/panes.svelte';

  let { paneId, label, children }: { paneId: PaneId; label: string; children: Snippet } = $props();
  let open = $derived(getActivePane() === paneId);
</script>

<aside class="pane" class:open>
  <p class="pane-header">{label}</p>
  {@render children()}
</aside>

<style>
  .pane {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 56px;
    max-height: 60vh;
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
    font: 700 12px/1 var(--font-ui);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-faint);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
    margin: 0 0 10px;
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
      max-height: none;
      border-top: none;
      border-left: 1px solid var(--border);
      border-radius: 0;
      box-shadow: -8px 0 20px var(--shadow);
      transform: translateX(110%);
    }
    .pane.open {
      transform: translateX(0);
    }
  }
</style>
