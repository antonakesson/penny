<script lang="ts">
  import Zone from './lib/components/Zone.svelte';
  import SignalTrace from './lib/components/SignalTrace.svelte';
  import Encounter from './lib/components/Encounter.svelte';
  import ActivePet from './lib/components/ActivePet.svelte';
  import Character from './lib/components/Character.svelte';
  import Inventory from './lib/components/Inventory.svelte';
  import Bestiary from './lib/components/Bestiary.svelte';
  import Pet from './lib/components/Pet.svelte';
  import Settings from './lib/components/Settings.svelte';
  import DevTools from './lib/components/DevTools.svelte';
  import Nav from './lib/components/Nav.svelte';
  import Pane from './lib/components/Pane.svelte';
  import ConfirmDialog from './lib/components/ConfirmDialog.svelte';
  import FeatureUnlockDialog from './lib/components/FeatureUnlockDialog.svelte';
  import ItemTooltip from './lib/components/ItemTooltip.svelte';
  import {
    tick,
    press,
    release,
    initGame,
    saveNow,
    getPendingFeatureAnnouncement,
    dismissFeatureAnnouncement,
  } from './lib/game/game';
  import { AUTOSAVE_INTERVAL_MS } from './lib/game/config';
  import { getConfirmRequest, resolveConfirm } from './lib/ui/confirmDialog.svelte';
  import { isPaneVisible } from './lib/ui/panes.svelte';

  let confirmRequest = $derived(getConfirmRequest());
  let featureAnnouncement = $derived(getPendingFeatureAnnouncement());

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

  // The whole page is the action surface — anywhere that isn't a real
  // control (a button, or the inventory pane) presses/releases the current
  // encounter's action. Forcing a small target for the core loop's only
  // input is the thing we're deliberately avoiding. Which activity actually
  // happens (swing vs. hold-drain) is decided inside engine.ts by the
  // current encounter's kind, not here.
  $effect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest('button, .pane')) return;
      press();
    }
    function handlePointerUp() {
      release();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('blur', handlePointerUp);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', handlePointerUp);
    };
  });
</script>

<div class="app-shell">
  <Nav />
  <main class="combat">
    <Zone />
    <SignalTrace />
    <Encounter />
    <ActivePet />
  </main>
  <Pane paneId="character" label="Character">
    <Character />
  </Pane>
  <Pane paneId="inventory" label="Inventory">
    <Inventory />
  </Pane>
  {#if isPaneVisible('bestiary')}
    <Pane paneId="bestiary" label="Bestiary">
      <Bestiary />
    </Pane>
  {/if}
  {#if isPaneVisible('pet')}
    <Pane paneId="pet" label="Pet">
      <Pet />
    </Pane>
  {/if}
  <Pane paneId="settings" label="Settings">
    <Settings />
  </Pane>
  {#if isPaneVisible('devtools')}
    <Pane paneId="devtools" label="Dev Tools">
      <DevTools />
    </Pane>
  {/if}
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

{#if featureAnnouncement}
  <FeatureUnlockDialog
    title={featureAnnouncement.title}
    message={featureAnnouncement.message}
    onDismiss={dismissFeatureAnnouncement}
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
