---
name: run-p2
description: Build, run, and drive the p2 idle game (static HTML/JS, no build step). Use when asked to start p2, screenshot its UI, or interact with the running game — activate slots, sail, equip/craft/use items.
---

Static site (`index.html` + ES modules under `src/`, no bundler, no
`package.json` at repo root) served locally and driven headlessly via
`.claude/skills/run-p2/driver.mjs` — a small chromium-cli-style REPL
built for this project (`chromium-cli` itself isn't installed in this
environment). Reads commands from stdin, one per line.

All paths below are relative to the repo root.

## Prerequisites

- `python` on PATH (any 3.x) — used only as a static file server
  (`python -m http.server`).
- Node with `playwright` installed **inside the skill dir** (kept out
  of the game's own dependency tree, which has none):

```bash
cd .claude/skills/run-p2
npm install
```

Playwright's browser binaries must be present at
`~/AppData/Local/ms-playwright` (Windows) / `~/.cache/ms-playwright`
(Linux/Mac). If `npx playwright install chromium` reports nothing to
download, they're already there; otherwise run it once.

## Run (agent path)

Pipe commands to the driver from the repo root:

```bash
cd .claude/skills/run-p2
node driver.mjs <<'EOF'
nav /index.html
wait-for #inventory-list
screenshot smoke
console --errors
quit
EOF
```

The driver spawns the static server itself (port 8934, killed on
`quit`/exit) — no separate server step needed.

Screenshots land in `.claude/skills/run-p2/screenshots/<name>.png`
(gitignored).

| command | what it does |
|---|---|
| `nav [path]` | goto `http://localhost:8934<path>` (default `/index.html`) |
| `wait-for text=<t>` | wait for visible text |
| `wait-for <selector>` | wait for selector |
| `click <selector>` | click |
| `fill <selector> <value>` | fill an input |
| `select <selector> <value>` | choose a `<select>` option (e.g. the slot's "Sail to…" dropdown) |
| `press <key>` | keyboard press |
| `seed-save <json>` | write a save to `localStorage` merged over `{slots:[],inventory:{},equipped:[]}` — see Gotchas, ordering matters |
| `reload` | reload the page |
| `eval <js>` | `page.evaluate`, prints the JSON result |
| `screenshot [name]` | PNG to `screenshots/` |
| `console --errors` | print collected console/page errors so far |
| `quit` | close browser + kill server |

## Run (human path)

```bash
python -m http.server 8934
```

Then open `http://localhost:8934/index.html` in a real browser.
`Ctrl-C` to stop.

## Test

No test suite exists yet.

---

## Gotchas

- **`seed-save` ordering.** `localStorage` isn't readable before a
  navigation has happened (`about:blank` throws
  `SecurityError: Failed to read the 'localStorage' property`, and
  doing it anyway wedges the page — later commands report `Target
  crashed`). Always `nav` first, `seed-save`, then `reload` — the save
  is only picked up on load (`storage.js`'s `loadSavedState` runs once
  at boot).
- **`seed-save`'s version field is hardcoded** to `SAVE_VERSION = 3` in
  the driver, tracking `storage.js`. If that constant bumps, update
  the driver too or seeded saves get silently discarded as
  version-mismatched.
- **Getting Rusty Hook (or any specific drop) without grinding RNG**:
  use `seed-save {"inventory":{"rustyHook":2}}` rather than clicking
  through zone rummaging — the drop table is weighted/random, not
  reliable for a scripted flow.
- **Sequential stdin only.** The driver processes commands with
  `for await...of` over readline specifically so piped/heredoc input
  (which arrives as one buffered chunk) still runs one command at a
  time — an `rl.on('line', async ...)` handler here would let `quit`
  race ahead of earlier awaits and kill the browser mid-flow. If you
  extend the driver, keep new commands inside that loop, not a
  separate listener.

## Troubleshooting

- **`Access is denied for this document` on `seed-save`**: ran
  `seed-save` before any `nav`. Add a `nav` first.
- **`Target crashed` on later commands**: usually the downstream
  symptom of the above — the page was left in a bad state after the
  `localStorage` error. Restart the driver rather than continuing the
  same session.
