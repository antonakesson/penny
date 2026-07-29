<script lang="ts">
  import { getAction } from '../game/game';

  let action = $derived(getAction());
  let holding = $derived(action.kind === 'investigate' && action.status === 'active');
  let label = $derived(holding ? 'Digging through it…' : 'Undisturbed');
</script>

<div class="investigation-meter">
  <p class="label">
    <span>{label}</span>
    <span class="hint">Hold to search</span>
  </p>
  <div class="bar">
    <div class="fill" class:holding></div>
  </div>
</div>

<style>
  .investigation-meter {
    max-width: 340px;
    margin-bottom: 20px;
  }
  .label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 8px;
  }
  .hint {
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
    opacity: 0.7;
  }
  .bar {
    height: 7px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--page-sunken);
    overflow: hidden;
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
