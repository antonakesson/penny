<script lang="ts">
  import { getMonster } from '../game/game';

  let monster = $derived(getMonster());
  let hpPct = $derived(Math.round((monster.hp / monster.maxHp) * 100));
  let entryLabel = $derived(`Entry No. ${String(monster.entryNo).padStart(3, '0')}`);
</script>

<section class="monster">
  <p class="entry-no">{entryLabel}</p>
  <div class="header">
    <h3 class="name">{monster.name}</h3>
    <span class="level">Lv. {monster.level}</span>
  </div>
  <div class="hp-bar"><div class="hp-fill" style="width: {hpPct}%"></div></div>
  <p class="hp-text">{monster.hp} / {monster.maxHp} HP</p>
</section>

<style>
  .monster {
    margin-bottom: 20px;
    max-width: 340px;
  }
  .entry-no {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent-text);
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .name {
    font: 700 20px/1.2 var(--font-structural);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ink-strong);
    margin: 0;
  }
  .level {
    font: 600 12px/1 var(--font-ui);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-faint);
    white-space: nowrap;
  }
  .hp-bar {
    height: 7px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--page-sunken);
    overflow: hidden;
  }
  .hp-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.15s ease-out;
  }
  .hp-text {
    margin: 6px 0 0;
    font: 400 13px/1 var(--font-ui);
    color: var(--ink-faint);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
