<script lang="ts">
  import { exportSave, importSave, resetSave } from '../game/game';
  import { requestConfirm } from '../ui/confirmDialog.svelte';

  function handleExport() {
    const encoded = exportSave();
    navigator.clipboard?.writeText(encoded).catch(() => {});
    prompt('Save copied to clipboard. You can also copy it manually below:', encoded);
  }

  function handleImport() {
    const encoded = prompt('Paste your exported save:');
    if (!encoded) return;
    if (!importSave(encoded)) alert('That save could not be read.');
  }

  function handleReset() {
    requestConfirm({
      title: 'Reset save',
      message: "This deletes all progress — inventory, XP, pets, everything — and can't be undone.",
      confirmLabel: "I'm sure",
      onConfirm: resetSave,
    });
  }
</script>

<div class="settings">
  <section>
    <p class="section-label">Save</p>
    <div class="row">
      <button onclick={handleExport}>Export save</button>
      <button onclick={handleImport}>Import save</button>
    </div>
  </section>
  <section>
    <p class="section-label">Danger zone</p>
    <button class="danger" onclick={handleReset}>Reset progress</button>
  </section>
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .section-label {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 10px;
  }
  .row {
    display: flex;
    gap: 8px;
  }
  button {
    font: 500 12px/1 var(--font-ui);
    letter-spacing: 0.04em;
    color: var(--ink);
    background: var(--page-sunken);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 14px;
  }
  .danger {
    color: var(--wax-on);
    background: var(--wax);
    border-color: var(--wax);
  }
</style>
