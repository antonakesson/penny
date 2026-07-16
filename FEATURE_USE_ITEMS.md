# Use-Items — (proposed feature - undecided)

**Depends on**
- Modifier Registry (`FEATURE_MODIFIERS.md`) — not yet implemented
- Buff system (timed modifier records) — not yet implemented, itself
  blocked on the registry above; see its "Buffs" open question there

**Loose ideas**
- A "use" action on inventory items (parallel to the existing
  equip/unequip button in `render.js`'s `renderInventory`), consuming
  one unit of the item on activation
- Effect is just a modifier record with an `expiresAt`, emitted into
  the same registry gear/talents will use — no separate buff-specific
  plumbing
- Debuffs are the same mechanism, just a negative/unfavorable `value`
  — no separate system
- TBD: stacking rules (does using a second Car Battery Charge Cell
  refresh duration, stack magnitude, or no-op while one's active?) —
  probably follows whatever the registry's combine-op answer ends up
  being for stacked `add`/`multiply` records
- TBD: where the "what's currently active + time remaining" UI lives
