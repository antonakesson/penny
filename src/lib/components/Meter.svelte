<script lang="ts">
  import type { Snippet } from 'svelte';

  // Shell only - label row and bar chrome. Fill direction/color/animation
  // is entirely the caller's via the fill snippet.
  let { label, secondary, fill }: { label?: string; secondary?: Snippet; fill: Snippet } = $props();
</script>

{#if label}
  <p class="label">
    <span>{label}</span>
    {#if secondary}{@render secondary()}{/if}
  </p>
{/if}
<div class="bar">
  {@render fill()}
</div>

<style>
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
  .bar {
    height: 7px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--page-sunken);
    overflow: hidden;
  }
</style>
