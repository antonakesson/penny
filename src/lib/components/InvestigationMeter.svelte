<script lang="ts">
  import { getAction } from '../game/game';
  import Meter from './Meter.svelte';

  let action = $derived(getAction());
  let holding = $derived(action.kind === 'investigate' && action.status === 'active');
  let label = $derived(holding ? 'Digging through it…' : 'Undisturbed');
</script>

<div class="investigation-meter">
  <Meter {label}>
    {#snippet secondary()}
      <span class="hint">Hold to search</span>
    {/snippet}
    {#snippet fill()}
      <div class="fill" class:holding></div>
    {/snippet}
  </Meter>
</div>

<style>
  .investigation-meter {
    max-width: 340px;
    margin-bottom: 20px;
  }
  .hint {
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
    opacity: 0.7;
  }
  .fill {
    height: 40%;
    width: 100%;
    margin: auto;
    background: var(--ink-faint);
    opacity: 0.5;
    transition: height 0.2s ease-out, opacity 0.2s ease-out, background-color 0.2s ease-out;
  }
  .fill.holding {
    height: 100%;
    opacity: 1;
    background: var(--rarity-uncommon);
    animation: pulse 0.6s ease-in-out infinite alternate;
  }
  @keyframes pulse {
    from {
      opacity: 0.75;
    }
    to {
      opacity: 1;
    }
  }
</style>
