#!/usr/bin/env node
// Headless-Chromium REPL for driving the p2 static site — the
// chromium-cli stand-in for this project (chromium-cli itself isn't
// installed in this environment). Reads commands from stdin, one per
// line. See SKILL.md for the command reference and a worked example.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..'); // <repo>/.claude/skills/run-p2 -> <repo>
const SHOT_DIR = join(__dirname, 'screenshots');
const PORT = 8934;
const BASE_URL = `http://localhost:${PORT}`;
const SAVE_KEY = 'idle-game-save';
const SAVE_VERSION = 3; // must track storage.js's SAVE_VERSION

mkdirSync(SHOT_DIR, { recursive: true });

let shotCount = 0;
const consoleErrors = [];

function log(...args) {
  console.log(...args);
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE_URL}/index.html`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`static server on ${BASE_URL} never came up`);
}

const server = spawn('python', ['-m', 'http.server', String(PORT)], {
  cwd: ROOT,
  stdio: 'ignore',
});

await waitForServer();
log(`[driver] static server up on ${BASE_URL} (pid ${server.pid})`);

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(String(err)));

function cleanup() {
  browser.close().catch(() => {});
  server.kill();
}
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(0));

async function handle(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;

  const [cmd, ...rest] = trimmed.split(/\s+/);
  const argLine = trimmed.slice(cmd.length).trim();

  switch (cmd) {
    case 'nav': {
      const path = rest[0] ?? '/index.html';
      await page.goto(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
      log(`[nav] ${page.url()}`);
      break;
    }
    case 'wait-for': {
      if (argLine.startsWith('text=')) {
        await page.getByText(argLine.slice('text='.length)).first().waitFor();
      } else {
        await page.waitForSelector(argLine);
      }
      log(`[wait-for] ok: ${argLine}`);
      break;
    }
    case 'click': {
      await page.click(argLine);
      log(`[click] ${argLine}`);
      break;
    }
    case 'fill': {
      const [selector, ...value] = rest;
      await page.fill(selector, value.join(' '));
      log(`[fill] ${selector} = ${value.join(' ')}`);
      break;
    }
    case 'select': {
      const [selector, value] = rest;
      await page.selectOption(selector, value);
      log(`[select] ${selector} = ${value}`);
      break;
    }
    case 'press': {
      await page.keyboard.press(rest[0]);
      log(`[press] ${rest[0]}`);
      break;
    }
    case 'seed-save': {
      // Project-specific helper: pre-seeds localStorage with a save so
      // an item/slot state can be tested without grinding drop RNG.
      // Shape merges into state.js's defaults (slots/inventory/equipped)
      // the same way storage.js's loadState does (Object.assign).
      const patch = JSON.parse(argLine);
      await page.evaluate(
        ({ key, version, patch }) => {
          const state = { slots: [], inventory: {}, equipped: [], ...patch };
          localStorage.setItem(key, JSON.stringify({ version, state }));
        },
        { key: SAVE_KEY, version: SAVE_VERSION, patch }
      );
      log(`[seed-save] ${argLine} (reload to take effect)`);
      break;
    }
    case 'eval': {
      const result = await page.evaluate(argLine);
      log('[eval]', JSON.stringify(result));
      break;
    }
    case 'screenshot': {
      const name = rest[0] ?? String(++shotCount);
      const path = join(SHOT_DIR, `${name}.png`);
      await page.screenshot({ path });
      log(`[screenshot] ${path}`);
      break;
    }
    case 'console': {
      if (rest[0] === '--errors') {
        log('[console --errors]', consoleErrors.length ? consoleErrors : 'none');
      }
      break;
    }
    case 'reload': {
      await page.reload();
      log('[reload] ok');
      break;
    }
    case 'quit':
      process.exit(0);
      break;
    default:
      log(`[driver] unknown command: ${cmd}`);
  }
}

// for-await, not rl.on('line', ...) — the latter fires every buffered
// line synchronously (piped/heredoc stdin arrives all at once), so
// async handlers overlap and a `quit` line can process.exit() while
// earlier commands are still mid-await. for-await pulls one line at a
// time and only advances once the previous handler's promise settles.
const rl = createInterface({ input: process.stdin });
for await (const line of rl) {
  try {
    await handle(line);
  } catch (err) {
    log(`[error] ${err.message}`);
  }
}
process.exit(0);
