<script lang="ts">
  import { SKILLS, type SkillId } from '../game/data/skills';
  import { SKILL_GRANTS } from '../game/data/skillGrants';
  import {
    pressSkill,
    releaseSkill,
    learnSkill,
    isSkillKnown,
    getActiveSkill,
    getSkillCooldownEndsAt,
    getBlockingFaculty,
    getKnownSkillIds,
    getLevelProgress,
  } from '../game/game';
  import { hotkeyLabelFor } from '../ui/hotkeys';

  // The concept board's shape tag (Icon/Toggle/Checklist/Dropdown) and its
  // avenue colour (proc/mode/world) are both gone from here. At three skills
  // neither was load-bearing: the tag's text said what pressing costs, which
  // the description already implies, and its colour sorted a roster too small
  // to need sorting. When the roster does grow into real families - travel,
  // passives, timed buffs - the answer is sections in this ladder, not a
  // colour on every row. Both concepts still live in the concept board
  // artifact if they're wanted back.

  let knownIds = $derived(getKnownSkillIds());
  let level = $derived(getLevelProgress().level);
  // Trainer only lists what's still worth training - a known skill already
  // has its own row up in Known, so repeating it down here (disabled,
  // "Known") is pure duplication rather than the concept board's ladder,
  // which had no separate Known section to duplicate against.
  let trainableIds = $derived((Object.keys(SKILLS) as SkillId[]).filter((id) => !isSkillKnown(id)));

  // Polls purely to re-render the cooldown dim-out, same shape
  // Character.svelte's activeEffects poll uses - engine.ts's tick() never
  // touches the DOM directly, so something has to notice time passing.
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 250);
    return () => clearInterval(id);
  });

  function isBusy(id: SkillId): boolean {
    if (getActiveSkill(id) !== null) return true;
    if (getBlockingFaculty(id) !== null) return true;
    const endsAt = getSkillCooldownEndsAt(id);
    return endsAt !== undefined && endsAt > now;
  }

  // Why a row won't respond, when the reason is something you're doing
  // rather than a timer. A dimmed row that says nothing reads as a bug; one
  // that says "hands occupied" reads as a rule.
  function blockedNote(id: SkillId): string | null {
    if (getActiveSkill(id) !== null) return null;
    const faculty = getBlockingFaculty(id);
    return faculty === null ? null : `${faculty} occupied`;
  }
</script>

{#if knownIds.length > 0}
  <div class="ladder">
    {#each knownIds as id (id)}
      {@const skill = SKILLS[id]}
      {@const busy = isBusy(id)}
      <div
        class="ladder-row known-row"
        class:locked={busy}
        role="button"
        tabindex="0"
        onpointerdown={() => pressSkill(id)}
        onpointerup={() => releaseSkill(id)}
        onpointercancel={() => releaseSkill(id)}
        onpointerleave={() => releaseSkill(id)}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && pressSkill(id)}
        onkeyup={(e) => (e.key === 'Enter' || e.key === ' ') && releaseSkill(id)}
      >
        <div class="ladder-info">
          <span class="ladder-title">
            <span class="ladder-name">{skill.name}</span>
            {#if hotkeyLabelFor(id, knownIds)}
              <span class="tag key">{hotkeyLabelFor(id, knownIds)}</span>
            {/if}
            {#if blockedNote(id)}
              <span class="blocked">{blockedNote(id)}</span>
            {/if}
          </span>
          <span class="ladder-mech">{skill.description}</span>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if trainableIds.length > 0}
  <div class="trainer-head">
    <p class="section-label">Skill Trainer — Even Levels Only</p>
    <span class="level-chip">Level {level}</span>
  </div>
  <div class="ladder">
    {#each trainableIds as id (id)}
      {@const skill = SKILLS[id]}
      {@const grantLevel = SKILL_GRANTS[id]}
      {@const ready = level >= grantLevel}
      <div class="ladder-row" class:locked={!ready}>
        <div class="ladder-level">{grantLevel}</div>
        <div class="ladder-info">
          <span class="ladder-name">{skill.name}</span>
          <span class="ladder-mech">{skill.description}</span>
        </div>
        <button class="learn-btn" class:disabled={!ready} disabled={!ready} onclick={() => learnSkill(id)}>
          {ready ? 'Learn' : 'Locked'}
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .section-label {
    font: 600 11px/1 var(--font-ui);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0;
  }
  .ladder + .trainer-head {
    margin-top: 18px;
  }
  .trainer-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .level-chip {
    font: 700 11px/1 var(--font-ui);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    color: var(--accent-text);
    border: 1px solid var(--accent);
    border-radius: 999px;
    padding: 4px 10px;
    background: color-mix(in srgb, var(--accent) 10%, var(--page));
    white-space: nowrap;
  }

  /* Ledger material - the list's own top border plus every row's bottom
     border reads as a divider above and below each row, sharing one rule
     between consecutive rows rather than doubling up. */
  .ladder {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
  }
  .ladder-row {
    display: grid;
    grid-template-columns: 30px 1fr;
    grid-template-areas:
      'level info'
      '. btn';
    row-gap: 4px;
    column-gap: 10px;
    align-items: start;
    padding: 10px 2px;
    border-bottom: 1px solid var(--border);
  }
  .ladder-row:first-child {
    border-top: 1px solid var(--border);
  }
  .ladder-row.locked {
    opacity: 0.5;
  }
  /* No level column here - it's the trainer's context (where you'd learn
     it), not the known list's; a skill you already have doesn't need its
     unlock level repeated back to you every time you'd click to use it. */
  .ladder-row.known-row {
    grid-template-columns: 1fr;
    grid-template-areas: 'info';
    cursor: pointer;
  }
  .ladder-row.known-row.locked {
    cursor: default;
  }
  .ladder-row.known-row:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .ladder-level {
    grid-area: level;
    font: 700 16px/1.3 var(--font-structural);
    font-variant-numeric: tabular-nums;
    color: var(--ink-strong);
    text-align: center;
  }
  .ladder-row.locked .ladder-level {
    color: var(--ink-faint);
  }
  .ladder-info {
    grid-area: info;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  /* The key rides with the name rather than down in the tag row - it names
     the thing rather than classifying it, so it belongs to the title line. */
  .ladder-title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .ladder-name {
    font: 700 14px/1.3 var(--font-structural);
    color: var(--ink-strong);
  }
  .ladder-mech {
    font: 400 13px/1.4 var(--font-body);
    color: var(--ink-faint);
  }
  /* Not a tag - it's a transient condition, not a property of the skill, so
     it deliberately doesn't take the tag's chrome. */
  .blocked {
    font: 400 12px/1 var(--font-body);
    font-style: italic;
    color: var(--wax);
    text-transform: lowercase;
  }
  /* Keycap, not a category - reads as a physical thing to press rather than
     another coloured family tag. */
  .tag.key {
    font-family: var(--font-structural);
    color: var(--ink-strong);
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    background: var(--page);
  }
  .tag {
    font: 600 10px/1 var(--font-ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 4px;
    padding: 3px 8px;
    white-space: nowrap;
  }
  .learn-btn {
    grid-area: btn;
    justify-self: start;
    font: 700 11px/1 var(--font-ui);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: 5px;
    padding: 6px 12px;
    border: 1px solid var(--accent);
    color: var(--accent-on);
    background: var(--accent);
    cursor: pointer;
    white-space: nowrap;
  }
  .learn-btn.disabled {
    background: transparent;
    color: var(--ink-faint);
    border-color: var(--border);
    cursor: not-allowed;
  }
</style>
