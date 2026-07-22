<script lang="ts">
  import { getFloatingTexts } from '../game/game';

  let texts = $derived(getFloatingTexts());
</script>

<div class="floating-text-layer">
  {#each texts as t (t.id)}
    <span class="floating-text floating-text-{t.variant}" style="left: calc(50% + {t.offset}px)">
      {t.text}
    </span>
  {/each}
</div>

<style>
  .floating-text-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
  .floating-text {
    position: absolute;
    top: 0;
    transform: translate(-50%, 0);
    font: 700 15px/1 var(--font-ui);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    white-space: nowrap;
    animation: float-rise 2.3s ease-out forwards;
  }
  .floating-text-damage {
    color: var(--wax);
  }
  .floating-text-loot {
    /* Common-tier color for now — the only item in the game is tagged
       Common in the style codex. Once items carry a real rarity field,
       this should read that instead of a fixed tier. */
    color: var(--rarity-common);
  }

  @keyframes float-rise {
    0% {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    30% {
      transform: translate(-50%, -2.4rem);
      opacity: 1;
    }
    70% {
      transform: translate(-50%, -2.4rem);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -2.4rem);
      opacity: 0;
    }
  }
</style>
