<script lang="ts">
  import Zone from './lib/components/Zone.svelte';
  import Monster from './lib/components/Monster.svelte';
  import AttackMeter from './lib/components/AttackMeter.svelte';
  import XpDisplay from './lib/components/XpDisplay.svelte';
  import Inventory from './lib/components/Inventory.svelte';
  import Nav from './lib/components/Nav.svelte';
  import Pane from './lib/components/Pane.svelte';
  import Chip from './lib/components/Chip.svelte';
  import { tick, startAction, initGame, saveNow, exportSave, importSave } from './lib/game/game';
  import { AUTOSAVE_INTERVAL_MS } from './lib/game/config';

  // Runs synchronously during component init, before first render — any
  // saved state is hydrated before the player sees a frame of fresh state.
  initGame();

  $effect(() => {
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  });

  // Autosave: a steady interval plus the two events that actually precede
  // data loss — the tab going to background and the page unloading.
  $effect(() => {
    const id = setInterval(saveNow, AUTOSAVE_INTERVAL_MS);
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') saveNow();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', saveNow);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', saveNow);
    };
  });

  function handleExport() {
    const encoded = exportSave();
    navigator.clipboard?.writeText(encoded).catch(() => {});
    prompt('Save copied to clipboard. You can also copy it manually below:', encoded);
  }

  function handleImport() {
    const encoded = prompt('Paste your exported save:');
    if (!encoded) return;
    if (!importSave(encoded)) alert('That save could not be read.');
  }

  // The whole page is the attack button — anywhere that isn't a real
  // control (a button, or the inventory pane) starts a swing. Forcing a
  // small target for the core loop's only input is the thing we're
  // deliberately avoiding.
  $effect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest('button, .pane')) return;
      startAction();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
</script>

<div class="app-shell">
  <Nav />
  <main class="combat">
    <Zone />
    <Monster />
    <AttackMeter />
    <XpDisplay />
  </main>
  <Pane paneId="inventory" label="Inventory">
    <Inventory />
  </Pane>
  <div class="version-badge">
    <Chip text="Version 0.1-alpha" />
  </div>
  <div class="save-controls">
    <button onclick={handleExport}>Export save</button>
    <button onclick={handleImport}>Import save</button>
  </div>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .combat {
    flex: 1;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: 20px 20px 84px;
  }

  .version-badge {
    position: fixed;
    left: 50%;
    bottom: 54px;
    transform: translateX(-50%);
    z-index: 1;
  }

  .save-controls {
    position: fixed;
    right: 12px;
    bottom: 54px;
    z-index: 1;
    display: flex;
    gap: 6px;
  }
  .save-controls button {
    font: 500 10px/1 var(--font-ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    background: var(--page-raised);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 10px;
  }

  @media (min-width: 900px) {
    .app-shell {
      flex-direction: row;
    }
    .combat {
      max-width: 560px;
      margin: 0 auto;
      padding: 32px 40px;
    }
    .version-badge {
      bottom: 16px;
    }
    .save-controls {
      bottom: 16px;
    }
  }
</style>
