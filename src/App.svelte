<script lang="ts">
  import HeroBanner from './lib/components/HeroBanner.svelte';
  import Zone from './lib/components/Zone.svelte';
  import MiniMap from './lib/components/MiniMap.svelte';
  import Encounter from './lib/components/Encounter.svelte';
  import ActivePet from './lib/components/ActivePet.svelte';
  import Character from './lib/components/Character.svelte';
  import Skills from './lib/components/Skills.svelte';
  import Inventory from './lib/components/Inventory.svelte';
  import Journal from './lib/components/Journal.svelte';
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
    pressSkill,
    releaseSkill,
    getKnownSkillIds,
    initGame,
    saveNow,
    getPendingFeatureAnnouncement,
    dismissFeatureAnnouncement,
    dismissDialog,
    getZone,
  } from './lib/game/game';
  import { AUTOSAVE_INTERVAL_MS } from './lib/game/config';
  import { getConfirmRequest, resolveConfirm } from './lib/ui/confirmDialog.svelte';
  import { isPaneVisible } from './lib/ui/panes.svelte';
  import { ACTION_KEY, skillForKey } from './lib/ui/hotkeys';

  let confirmRequest = $derived(getConfirmRequest());
  let featureAnnouncement = $derived(getPendingFeatureAnnouncement());
  // Only for the tint below (see zoneColors.css) - nothing else here reads
  // the zone, so this stays a plain derived value rather than its own module.
  let zoneId = $derived(getZone().zoneId);

  // Runs before first render, so saved state hydrates before the player
  // sees a frame of fresh state.
  initGame();

  $effect(() => {
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  });

  // Steady interval plus the two events that precede actual data loss.
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

  // The whole page is the action surface - anywhere that isn't a real
  // control presses/releases the current encounter's action. Dialog's
  // "Continue" rides the same click instead of its own button - press()
  // and dismissDialog() each no-op unless the current encounter matches
  // their kind, so firing both here is safe.
  $effect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest('button, .pane')) return;
      press();
      dismissDialog();
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

  // Same press/release pair as the pointer surface above, just reached by
  // keyboard - both are thin adapters onto engine.ts's pressSkill/
  // releaseSkill, which is also what the Skills pane rows call. Space is
  // whatever the current encounter is fought with (press() resolves that);
  // Q/W/E/R/T are the utility skills in learn order (see ui/hotkeys.ts).
  $effect(() => {
    function isTyping(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      );
    }
    function handleKeyDown(event: KeyboardEvent) {
      // repeat: a held key fires keydown over and over, which would re-press
      // a channel every few ms instead of holding it once.
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      if (event.key === ACTION_KEY) {
        // Space scrolls the page and activates whatever button has focus -
        // including, on a bad day, a dialog choice.
        event.preventDefault();
        press();
        return;
      }
      const skillId = skillForKey(event.key.toLowerCase(), getKnownSkillIds());
      if (skillId) pressSkill(skillId);
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (isTyping(event.target)) return;
      if (event.key === ACTION_KEY) {
        release();
        return;
      }
      const skillId = skillForKey(event.key.toLowerCase(), getKnownSkillIds());
      if (skillId) releaseSkill(skillId);
    }
    // Alt-tabbing mid-channel never delivers the keyup, so let go of
    // everything held rather than leaving a channel running unattended.
    function releaseEverything() {
      release();
      for (const id of getKnownSkillIds()) releaseSkill(id);
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', releaseEverything);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', releaseEverything);
    };
  });
</script>

<div class="app-shell">
  <Nav />
  <main class="combat" data-zone={zoneId}>
    <HeroBanner />
    <Zone />
    <MiniMap />
    <Encounter />
    <ActivePet />
  </main>
  <Pane paneId="character" label="Character">
    <Character />
  </Pane>
  <Pane paneId="skills" label="Skills">
    <Skills />
  </Pane>
  <Pane paneId="inventory" label="Inventory">
    <Inventory />
  </Pane>
  {#if isPaneVisible('journal')}
    <Pane paneId="journal" label="Journal">
      <Journal />
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
    /* --zone-tint is set per [data-zone] in zoneColors.css - mixing it
       against --page rather than replacing it keeps the surface's own
       light/dark value doing the work, this just washes it slightly. */
    background: color-mix(in srgb, var(--page) 88%, var(--zone-tint) 12%);
    transition: background-color 800ms ease;
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
