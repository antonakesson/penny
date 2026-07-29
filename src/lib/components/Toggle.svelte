<script lang="ts">
  let { label, checked, onchange }: { label: string; checked: boolean; onchange: (value: boolean) => void } =
    $props();
</script>

<button type="button" role="switch" aria-checked={checked} onclick={() => onchange(!checked)}>
  {label}: {checked ? 'On' : 'Off'}
</button>

<style>
  button {
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--ink);
    background: var(--page-sunken);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 14px;
  }
</style>
