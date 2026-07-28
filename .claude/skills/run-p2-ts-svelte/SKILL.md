---
name: run-p2-ts-svelte
description: Build, run, and drive the p2-ts-svelte idle game. Use when asked to start the app, run the dev server, take a screenshot, or click through the UI to verify a change.
---

Svelte 5 + Vite + TypeScript idle game, no separate build needed for
dev. This is a plain browser web app — no `chromium-cli`/Playwright is
installed in this environment, so it's driven with the
`mcp__claude-in-chrome__*` tools (the user's real Chrome, via the
Claude-in-Chrome extension) instead. All paths below are relative to
the repo root.

## Prerequisites

Node + npm already on PATH (verified with Node v24.10.0 / npm 11.6.1,
fnm-managed — a "current Node.js path is not on your PATH" warning
from fnm on every command is harmless noise, not a failure).

## Setup

```bash
npm install
```

## Run (agent path)

Start the dev server on a **fixed, known port** — plain `vite` picks a
random free port and prints it, which is unscriptable — then poll
until it actually serves:

```bash
nohup npm run dev -- --port 5183 --strictPort > /c/Users/<you>/AppData/Local/Temp/vite-run.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:5183 >/dev/null; do sleep 1; done' && echo "SERVER UP"
```

Then drive it with the Claude-in-Chrome MCP tools (load them via
`ToolSearch` first if deferred):

```
tabs_context_mcp {createIfEmpty: true}       # once per conversation
navigate {url: "http://localhost:5183", tabId: <tab>}
computer {action: "screenshot", tabId: <tab>, save_to_disk: true}
```

To exercise the core loop: the **entire page is the attack button**
(App.svelte's document click handler fires on any click that isn't a
`button` or `.pane`) — `computer {action:"left_click", coordinate:[x,y]}`
anywhere in the main combat column damages the current monster. Follow
with `read_console_messages {onlyErrors:true, pattern:"."}` to confirm
nothing threw.

Prefer `browser_batch` to chain navigate → wait → screenshot →
console-check in one round trip instead of four separate calls.

**Stop the server** — `npm run dev &`'s `$!` is the `npm` wrapper, not
the actual Vite process, and npm doesn't forward signals to it on
Windows, so kill by the port instead:

```bash
pid=$(netstat -ano | grep LISTENING | grep 5183 | awk '{print $5}' | head -1)
powershell -NoProfile -Command "Stop-Process -Id $pid -Force"
```

## Run (human path)

```bash
npm run dev   # → prints a local URL, Ctrl-C to stop
```

## Test

```bash
npm run check   # svelte-check + tsc, no emit
```

## Gotchas

- **Unpinned `vite` port** — always pass `--port <N> --strictPort`;
  otherwise it silently picks a different free port when the one you
  wanted is busy, and any scripted `curl`/browser step targets the
  wrong URL.
- **`$TMPDIR` isn't set in this Bash tool** — redirecting a background
  job's output to `$TMPDIR/...` fails with "Permission denied" (it
  expands to nothing, so the path becomes `/...` at filesystem root).
  Redirect to an explicit path instead.
- **PID for stopping the server** — `netstat -ano | grep LISTENING` is
  the reliable way to find the real Vite process on Windows; `$!` after
  `npm run dev &` only gets you the npm wrapper's PID, which does not
  free the port when killed.
- **No `chromium-cli`/Playwright here** — this is a Windows desktop
  session, not a headless Linux container. Use the already-connected
  `mcp__claude-in-chrome__*` tools instead; they drive the user's real
  Chrome and don't need any install step.
