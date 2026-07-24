<script lang="ts">
  import Zone from './lib/components/Zone.svelte';
  import Encounter from './lib/components/Encounter.svelte';
  import AttackMeter from './lib/components/AttackMeter.svelte';
  import XpDisplay from './lib/components/XpDisplay.svelte';
  import Inventory from './lib/components/Inventory.svelte';
  import Bestiary from './lib/components/Bestiary.svelte';
  import Settings from './lib/components/Settings.svelte';
  import Nav from './lib/components/Nav.svelte';
  import Pane from './lib/components/Pane.svelte';
  import ConfirmDialog from './lib/components/ConfirmDialog.svelte';
  import ItemTooltip from './lib/components/ItemTooltip.svelte';
  import { tick, click, initGame, saveNow, getEncounter } from './lib/game/game';
  import { AUTOSAVE_INTERVAL_MS } from './lib/game/config';
  import { getConfirmRequest, resolveConfirm } from './lib/ui/confirmDialog.svelte';

  let encounter = $derived(getEncounter());
  let confirmRequest = $derived(getConfirmRequest());

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

  // The whole page is the attack button — anywhere that isn't a real
  // control (a button, or the inventory pane) starts a swing. Forcing a
  // small target for the core loop's only input is the thing we're
  // deliberately avoiding.
  $effect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest('button, .pane')) return;
      click();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
</script>

<div class="app-shell">
  <Nav />
  <main class="combat">
    <Zone />
    <Encounter />
    {#if encounter.kind === 'monster'}<AttackMeter />{/if}
    <XpDisplay />
  </main>
  <Pane paneId="inventory" label="Inventory">
    <Inventory />
  </Pane>
  <Pane paneId="bestiary" label="Bestiary">
    <Bestiary />
  </Pane>
  <Pane paneId="settings" label="Settings">
    <Settings />
  </Pane>
</div>

{#if confirmRequest}
  <ConfirmDialog
    title={confirmRequest.title}
    message={confirmRequest.message}
    confirmLabel={confirmRequest.confirmLabel}
    onConfirm={() => resolveConfirm(true)}
    onCancel={() => resolveConfirm(false)}
  />
{/if}

<ItemTooltip />

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

  @media (min-width: 900px) {
    .app-shell {
      flex-direction: row;
    }
    .combat {
      max-width: 560px;
      margin: 0;
      padding: 32px 40px;
    }
  }
</style>
