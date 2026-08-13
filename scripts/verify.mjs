#!/usr/bin/env node
// Self-contained headless smoke test for the AI Game Lab production track.
//
// Default mode needs NO manual setup: this script starts its own Vite dev
// server (ephemeral port) and launches its own headless browser (ephemeral
// CDP port, read from the browser's DevToolsActivePort file), runs the
// checks, then tears both down. Safe to run even if you already have
// `npm run dev` open on the default port — nothing here binds to a fixed one.
//
// Checks: app booted (window.__demo), logical display is exactly 1280x720,
// contain-scale math matches renderer.screen, seed applied, sim has ticked,
// and the particle scene actually renders (CDP screenshot decoded in-page).
//
// Browser resolution: tries, in order, msedge / microsoft-edge-stable /
// microsoft-edge / google-chrome-stable / google-chrome / chromium-browser /
// chromium (covers Windows dev machines and GitHub-hosted Ubuntu runners,
// which ship both Edge and Chrome). Override with VERIFY_BROWSER_PATH.
//
// Usage:
//   node scripts/verify.mjs                     # self-contained (default)
//   node scripts/verify.mjs <url> [port]         # attach to something
//                                                 # already running (manual
//                                                 # debugging)
//
// NOTE: headless pages are throttled (~5-8 FPS) and document.hidden is true;
// FPS and extract.pixels() readings are meaningless. This script verifies
// boot, geometry math, and that content is actually drawn (screenshot
// sampling) — never trust headless FPS/extract readings.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, openSync, closeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "vite";

const ROOT = resolve(import.meta.dirname, "..");
const SEED = 1337;

const attachArg = process.argv[2];
const isAttach = !!attachArg && /^https?:\/\//.test(attachArg);

const failures = [];
function check(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
}

let viteServer = null;
let browserProc = null;
let userDataDir = null;
let stderrFd = null;

try {
  let baseUrl;
  let cdpBase;

  if (isAttach) {
    // Manual/legacy mode: attach to a server + browser already running.
    baseUrl = attachArg;
    const port = process.argv[3] ?? "9222";
    cdpBase = `http://127.0.0.1:${port}`;
  } else {
    viteServer = await createServer({
      root: ROOT,
      configFile: join(ROOT, "vite.config.ts"),
      server: { host: "127.0.0.1" },
      logLevel: "warn",
    });
    await viteServer.listen(0);
    const vitePort = viteServer.httpServer.address().port;
    baseUrl = `http://127.0.0.1:${vitePort}/`;

    const browserPath = resolveBrowserBinary();
    if (!browserPath) {
      throw new Error(
        "no headless-capable browser found (tried msedge/microsoft-edge/" +
          "google-chrome/chromium) — set VERIFY_BROWSER_PATH to an explicit binary path",
      );
    }

    userDataDir = mkdtempSync(join(tmpdir(), "verify-cdp-"));
    // Capture the browser's stderr to a file so a launch failure is
    // diagnosable instead of a blind timeout (stdout/stderr are otherwise
    // dropped on CI).
    const stderrLog = join(userDataDir, "browser-stderr.log");
    stderrFd = openSync(stderrLog, "w");
    browserProc = spawn(
      browserPath,
      [
        "--headless=new",
        "--disable-gpu",
        // Required on CI/container kernels (e.g. Ubuntu 24.04 GitHub runners)
        // where unprivileged user namespaces are restricted by AppArmor —
        // Chromium's sandbox then fails at startup and the browser exits
        // before DevTools opens. Safe here: throwaway profile, first-party
        // localhost content only.
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--enable-unsafe-swiftshader",
        "--no-first-run",
        `--user-data-dir=${userDataDir}`,
        "--remote-debugging-port=0",
        "--window-size=1440,900",
        `${baseUrl}?seed=${SEED}`,
      ],
      // detached on POSIX so killTree can signal the whole process group,
      // not just the direct child (Chromium forks GPU/renderer/zygote procs).
      { stdio: ["ignore", "ignore", stderrFd], detached: process.platform !== "win32" },
    );
    let browserSpawnError = null;
    browserProc.once("error", (err) => {
      browserSpawnError = err;
    });

    const cdpPort = await waitForDevToolsPort(
      userDataDir,
      browserProc,
      stderrLog,
      20000,
      () => browserSpawnError,
    );
    cdpBase = `http://127.0.0.1:${cdpPort}`;
  }

  await runChecks(cdpBase, baseUrl);
} catch (err) {
  check(`verify harness error: ${err.message}`, false);
} finally {
  if (browserProc) await killTree(browserProc);
  if (stderrFd !== null) closeSync(stderrFd);
  if (viteServer) await viteServer.close();
  // Windows can hold the profile dir open briefly after the process exits
  // (AV scan, delayed handle release) — retry instead of crashing on EBUSY.
  if (userDataDir) {
    rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nAll checks passed.");
process.exit(0);

// --- self-contained mode helpers ---

function resolveBrowserBinary() {
  if (process.env.VERIFY_BROWSER_PATH) return process.env.VERIFY_BROWSER_PATH;

  const candidates = [
    "msedge",
    "microsoft-edge-stable",
    "microsoft-edge",
    "google-chrome-stable",
    "google-chrome",
    "chromium-browser",
    "chromium",
  ];
  const finder = process.platform === "win32" ? "where" : "which";
  for (const c of candidates) {
    const r = spawnSync(finder, [c], { encoding: "utf8" });
    if (r.status === 0) {
      const first = r.stdout.split(/\r?\n/).find((l) => l.trim());
      if (first) return first.trim();
    }
  }

  const fallbacks =
    {
      win32: [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      ],
      darwin: [
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
      ],
    }[process.platform] ?? [];
  return fallbacks.find((p) => existsSync(p)) ?? null;
}

async function waitForDevToolsPort(dir, proc, stderrLog, timeoutMs = 20000, getSpawnError = () => null) {
  const file = join(dir, "DevToolsActivePort");
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const spawnError = getSpawnError();
    if (spawnError) throw new Error(`browser failed to launch: ${spawnError.message}`);
    if (proc.exitCode !== null || proc.signalCode !== null) {
      throw new Error(
        `browser exited early (code ${proc.exitCode ?? "signal"}${proc.signalCode ? ` ${proc.signalCode}` : ""})` +
          ` before DevTools opened${stderrTail(stderrLog)}`,
      );
    }
    if (existsSync(file)) {
      const port = parseInt(readFileSync(file, "utf8").split(/\r?\n/)[0], 10);
      if (Number.isFinite(port) && port > 0) return port;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`timed out waiting for the browser's DevTools port${stderrTail(stderrLog)}`);
}

/** Last few lines of the browser's captured stderr, for diagnosing launch
 * failures ("" when nothing was captured). */
function stderrTail(logPath, maxLines = 12) {
  if (!logPath || !existsSync(logPath)) return "";
  const text = readFileSync(logPath, "utf8").trim();
  if (!text) return "";
  return ` — browser stderr: ${text.split(/\r?\n/).slice(-maxLines).join(" | ")}`;
}

/** Kill the browser and wait for it to actually exit before returning — the
 * caller removes its profile dir right after, and Windows still holds file
 * locks until the process has fully torn down, not just been signaled. On
 * POSIX, kill the whole process group (Chromium forks GPU/renderer/zygote
 * children); a bare SIGTERM to just the main process can leave them behind. */
function killTree(proc) {
  return new Promise((resolveExit) => {
    if (proc.exitCode !== null || proc.signalCode !== null) {
      resolveExit();
      return;
    }
    proc.once("exit", () => resolveExit());
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"]);
    } else {
      try {
        process.kill(-proc.pid, "SIGKILL");
      } catch {
        proc.kill("SIGKILL");
      }
    }
    // Fallback in case the exit event is somehow missed.
    setTimeout(resolveExit, 3000);
  });
}

// --- CDP checks (shared by both modes) ---

async function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };
  function send(method, params = {}, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const id = ++msgId;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP command timed out after ${timeoutMs}ms: ${method}`));
      }, timeoutMs);
      pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  return { send, close: () => ws.close() };
}

async function runChecks(cdpBase, baseUrl) {
  const host = baseUrl.replace(/^https?:\/\//, "").split("/")[0];
  const list = await (
    await fetch(`${cdpBase}/json`, { signal: AbortSignal.timeout(15000) })
  ).json();
  const page = list.find((t) => t.type === "page" && t.url.includes(host));
  if (!page) {
    check(`page target found for ${baseUrl}`, false, `no target on ${cdpBase}`);
    return;
  }

  const cdp = await connectCdp(page.webSocketDebuggerUrl);
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await new Promise((r) => setTimeout(r, 3500));

    const boot = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const d = window.__demo;
        if (!d) return { ready: false };
        const s = d.viewport.stats;
        return {
          ready: true,
          screen: [s.screenWidth, s.screenHeight],
          logical: [s.logicalWidth, s.logicalHeight],
          scale: s.scale,
          offsetX: s.offsetX,
          offsetY: s.offsetY,
          ticks: d.scene ? d.scene.ticks : 0,
          seed: d.seed ?? null,
          canvas: [d.app.canvas.width, d.app.canvas.height],
        };
      })()`,
      returnByValue: true,
    });
    const b = boot.result?.value;
    check("app booted (window.__demo)", !!b?.ready);
    check(
      "logical display is 1280x720",
      b?.logical?.[0] === 1280 && b?.logical?.[1] === 720,
    );
    if (b?.scale) {
      const expected = Math.min(b.screen[0] / 1280, b.screen[1] / 720);
      check(
        "contain scale matches renderer.screen",
        Math.abs(b.scale - expected) < 0.0001,
        `scale=${b.scale.toFixed(4)}`,
      );
      check("stage centered (no negative offset)", b.offsetX >= 0 && b.offsetY >= 0);
    }
    check("seed applied", b?.seed === SEED, `seed=${b?.seed}`);
    check("sim has ticked (fixed timestep running)", (b?.ticks ?? 0) > 0, `ticks=${b?.ticks}`);

    const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
    const sample = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        const img = new Image();
        img.src = "data:image/png;base64,${shot.data}";
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        const data = g.getImageData(0, 0, c.width, c.height).data;
        let lit = 0, total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const l = data[i] + data[i + 1] + data[i + 2];
          if (l > 60) lit++;
          total++;
        }
        return { w: c.width, h: c.height, lit, total };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const s = sample.result?.value ?? {};
    check(
      "particles render (lit pixels present)",
      (s.lit ?? 0) > 300,
      `lit=${s.lit} of ${s.total}`,
    );
  } finally {
    cdp.close();
  }
}
