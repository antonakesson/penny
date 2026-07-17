# Use-Items

**Status: flavor-only slice implemented.** Items can declare
`onUseEffect: <id>` referencing `effects.js`'s `EFFECTS` registry
(same closed-registry pattern as `zones.js`/`treasureClasses.js`). A
"Use" button (`render.js`'s `renderInventory`, parallel to the
existing equip/unequip button) consumes one unit and shows the
effect's `message`. See `engine.js`'s `useItem`. First item: Rusty
Hook → `tetanus` (flavor only, no gameplay effect).

**Depends on, for anything beyond flavor**
- Modifier Registry (`FEATURE_MODIFIERS.md`) — not yet implemented
- Buff system (timed modifier records) — not yet implemented, itself
  blocked on the registry above; see its "Buffs" open question there

**Loose ideas (unimplemented part)**
- An `EFFECTS` entry grows a `modifier: { id, params, value }` (or
  `expiresAt` for timed ones), emitted into the same registry gear/
  talents will use — no separate buff-specific plumbing. Items keep
  pointing at the same `onUseEffect` id; only what that id resolves to
  changes.
- Debuffs are the same mechanism, just a negative/unfavorable `value`
  — no separate system
- TBD: stacking rules (does using a second Car Battery Charge Cell
  refresh duration, stack magnitude, or no-op while one's active?) —
  probably follows whatever the registry's combine-op answer ends up
  being for stacked `add`/`multiply` records
- TBD: where the "what's currently active + time remaining" UI lives
