<script lang="ts">
  import { PANES, PLANNED_PANES, getActivePane, togglePane, isPaneVisible, type PaneId } from '../ui/panes.svelte';

  let paneIds = $derived((Object.keys(PANES) as PaneId[]).filter(isPaneVisible));
</script>

<nav>
  {#each paneIds as id (id)}
    <button class="nav-item" class:active={getActivePane() === id} onclick={() => togglePane(id)}>
      {PANES[id].label}
    </button>
  {/each}
  {#each PLANNED_PANES as label (label)}
    <button class="nav-item" disabled title="Not yet implemented">
      {label}
    </button>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    background: var(--page-sunken);
    border-top: 1px solid var(--border);
    z-index: 3;
  }
  .nav-item {
    flex: 1;
    padding: 12px 4px 14px;
    background: none;
    border: none;
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .nav-item.active {
    color: var(--accent-text);
  }
  .nav-item:disabled {
    opacity: 0.4;
  }

  @media (min-width: 900px) {
    nav {
      position: sticky;
      top: 0;
      align-self: flex-start;
      height: 100vh;
      flex-direction: column;
      width: 220px;
      gap: 4px;
      padding: 32px 0;
      border-top: none;
      border-right: 1px solid var(--border);
    }
    .nav-item {
      flex: none;
      text-align: left;
      padding: 16px 28px;
      font-size: 13px;
      letter-spacing: 0.12em;
    }
    .nav-item.active {
      background: var(--page-raised);
      border-left: 3px solid var(--accent);
    }
  }
</style>
