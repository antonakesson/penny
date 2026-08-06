<script lang="ts">
  import { exportSave, importSave, resetSave, getSeed, getDistance, isSoundEnabled, setSoundEnabled } from '../game/game';
  import { requestConfirm } from '../ui/confirmDialog.svelte';
  import Chip from './Chip.svelte';
  import Toggle from './Toggle.svelte';

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
    <p class="section-label">Audio</p>
    <div class="row">
      <Toggle label="Sound" checked={isSoundEnabled()} onchange={setSoundEnabled} />
    </div>
  </section>
  <dl class="status">
    <div class="stat-row">
      <dt>Seed</dt>
      <dd>{getSeed()}</dd>
    </div>
    <div class="stat-row">
      <dt>Distance</dt>
      <dd>{getDistance()}</dd>
    </div>
  </dl>
  <div class="fill"></div>
  <section>
    <p class="section-label">Danger zone</p>
    <button class="danger" onclick={handleReset}>Reset progress</button>
  </section>
  <div class="version">
    <Chip text="Version 0.5-alpha" />
  </div>
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    gap: 20px;
  }
  /* Compose Modifier.weight(1f) equivalent: an empty flex child that
     absorbs all leftover column space, pinning .version below it. */
  .fill {
    flex: 1 1 auto;
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
  .status {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
  }
  .stat-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font: 500 12px/1.4 var(--font-ui);
  }
  dt {
    color: var(--ink-faint);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 11px;
  }
  dd {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-mono);
    word-break: break-all;
  }
</style>
