<script lang="ts">
  let { text }: { text: string } = $props();
</script>

<span class="chip">{text}</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent-text);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 8px 18px;
  }
  .chip::before {
    content: '◆';
    color: var(--accent);
  }
</style>
