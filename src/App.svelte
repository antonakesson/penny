<script lang="ts">
  import Zone from './lib/components/Zone.svelte';
  import Monster from './lib/components/Monster.svelte';
  import AttackMeter from './lib/components/AttackMeter.svelte';
  import XpDisplay from './lib/components/XpDisplay.svelte';
  import Inventory from './lib/components/Inventory.svelte';
  import Nav from './lib/components/Nav.svelte';
  import Pane from './lib/components/Pane.svelte';
  import Chip from './lib/components/Chip.svelte';
  import { tick, startAction } from './lib/game/game';

  $effect(() => {
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  });

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
  }
</style>
