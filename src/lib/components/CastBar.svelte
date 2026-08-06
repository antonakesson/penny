<script lang="ts">
  import { getPrimaryActivation } from '../game/game';
  import { SKILLS, type SkillId } from '../game/data/skills';

  // The skill to show at rest, so the ring holds its place between
  // activations instead of the layout jumping every time a swing ends.
  // Whatever's actually running always wins over it.
  let { idleSkill }: { idleSkill?: SkillId } = $props();

  const R = 32;
  const C = 2 * Math.PI * R;
  // How long the tick/impact pip stays lit.
  const FLASH_MS = 200;

  let now = $state(Date.now());
  $effect(() => {
    let frame = requestAnimationFrame(function loop() {
      now = Date.now();
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  });

  let active = $derived(getPrimaryActivation());
  let skillId = $derived(active?.id ?? idleSkill ?? null);
  let phase = $derived(active?.phase ?? 'idle');
  let elapsed = $derived(active ? Math.max(0, now - active.startedAt) : 0);

  // When the skill last landed a hit, read straight off the activation
  // rather than tracked as a transition: a channel carries lastTickAt, and a
  // cast fires at the instant it starts recovering, which is exactly what
  // setSkillPhase stamps startedAt with. A cast with no cooldown has no
  // recovering phase and so no flash - nothing has one today.
  let firedAt = $derived.by(() => {
    if (!active) return 0;
    if (phase === 'channeling') return active.lastTickAt;
    if (phase === 'recovering') return active.startedAt;
    return 0;
  });
  let flash = $derived(Math.max(0, 1 - (now - firedAt) / FLASH_MS));

  let timing = $derived(skillId ? SKILLS[skillId].timing : null);

  // Arc length and rotation carry every phase without changing metaphor: it
  // grows while a cast winds up, unwinds while recovering, and becomes a
  // fixed segment revolving during a channel - which has no end to fill
  // toward, so the ring reports cadence instead of completion.
  let arc = $derived.by(() => {
    if (!timing) return { length: 0, rotation: -90, tone: 'idle' as const };
    if (phase === 'casting' && timing.kind === 'cast') {
      return {
        length: Math.min(1, elapsed / timing.castTimeMs) * C,
        rotation: -90,
        tone: 'cast' as const,
      };
    }
    if (phase === 'channeling' && timing.kind === 'channel') {
      const ticks = elapsed / timing.tickMs;
      return { length: C * 0.24, rotation: -90 + ticks * 90, tone: 'channel' as const };
    }
    if (phase === 'recovering' && skillId) {
      const { cooldownMs } = SKILLS[skillId];
      const left = cooldownMs > 0 ? Math.max(0, 1 - elapsed / cooldownMs) : 0;
      return { length: left * C, rotation: -90, tone: 'recover' as const };
    }
    return { length: 0, rotation: -90, tone: 'idle' as const };
  });

  let remainingMs = $derived.by(() => {
    if (!timing || !skillId) return 0;
    if (phase === 'casting' && timing.kind === 'cast') return Math.max(0, timing.castTimeMs - elapsed);
    if (phase === 'recovering') return Math.max(0, SKILLS[skillId].cooldownMs - elapsed);
    return 0;
  });

  // Elapsed, not remaining, while channelling - there's no end to count
  // toward, and how long you've been at it is the honest number. What that
  // buys you is already on the card.
  let readout = $derived(
    phase === 'idle' ? '—' : phase === 'channeling' ? (elapsed / 1000).toFixed(1) : (remainingMs / 1000).toFixed(1)
  );

  let caption = $derived.by(() => {
    if (!skillId) return '';
    const skill = SKILLS[skillId];
    if (phase === 'idle') return 'Ready';
    if (phase === 'recovering') return 'Recovering…';
    return `${skill.verb ?? skill.name}…`;
  });
</script>

{#if skillId}
  <div class="cast-bar">
    <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
      <circle cx="43" cy="43" r={R} fill="none" stroke="var(--border)" stroke-width="6" />
      <circle
        cx="43"
        cy="43"
        r={R}
        fill="none"
        stroke-width="6"
        class="arc {arc.tone}"
        stroke-dasharray="{arc.length} {C}"
        transform="rotate({arc.rotation} 43 43)"
      />
      <circle cx="43" cy="11" r="3.5" fill="var(--wax)" opacity={flash} />
      <text class="readout" x="43" y="48" text-anchor="middle">{readout}</text>
    </svg>
    <div class="read">
      <span class="skill">{SKILLS[skillId].name}</span>
      <span class="caption">{caption}</span>
    </div>
  </div>
{/if}

<style>
  .cast-bar {
    display: flex;
    align-items: center;
    gap: 18px;
    max-width: 340px;
    margin-bottom: 20px;
  }
  .arc {
    transition: stroke 0.2s ease-in-out;
  }
  .arc.cast {
    stroke: var(--accent);
  }
  .arc.channel {
    stroke: var(--rarity-uncommon);
  }
  .arc.recover {
    stroke: var(--ink-faint);
  }
  .arc.idle {
    stroke: transparent;
  }
  .readout {
    font: 600 15px/1 var(--font-ui);
    font-variant-numeric: tabular-nums;
    fill: var(--ink-strong);
  }
  .read {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .skill {
    font: 700 13px/1.2 var(--font-structural);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-strong);
  }
  .caption {
    font: 400 15px/1.3 var(--font-body);
    font-style: italic;
    color: var(--ink-faint);
  }
</style>
