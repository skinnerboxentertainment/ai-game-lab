// Headless smoke test for the AI Game Lab production track.
//
// Checks that the app booted (window.__demo), the logical display is exactly
// 1280x720, contain-scale math matches renderer.screen, and the particle scene
// actually renders (CDP screenshot decoded in-page).
//
// Prerequisites:
//   1. npm run dev
//   2. msedge --headless=new --disable-gpu --enable-unsafe-swiftshader
//        --no-first-run --user-data-dir=%TEMP%\edge-cdp
//        --remote-debugging-port=9222 --window-size=1440,900
//        http://localhost:5173/?seed=1337
//
// Usage: node scripts/verify.mjs [url] [port]
//
// NOTE: headless pages are throttled (~5-8 FPS) and document.hidden is true;
// FPS and extract.pixels() readings here are meaningless. This test verifies
// boot, geometry math, and that content is actually drawn (screenshot sampling).

const urlArg = process.argv[2] ?? "http://localhost:5173/";
const portArg = process.argv[3] ?? "9222";
const CDP_BASE = `http://127.0.0.1:${portArg}`;

const host = urlArg.replace(/^https?:\/\//, "").split("/")[0];
const list = await (await fetch(`${CDP_BASE}/json`)).json();
const page = list.find(
  (t) => t.type === "page" && t.url.includes(host),
);

if (!page) {
  console.error(`FAIL: no page target for ${urlArg} on CDP port ${portArg}`);
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
};

const failures = [];
const check = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
};

ws.onopen = async () => {
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await new Promise((r) => setTimeout(r, 3500));

    const boot = await send("Runtime.evaluate", {
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
    check("seed applied", b?.seed === 1337, `seed=${b?.seed}`);
    check("sim has ticked (fixed timestep running)", (b?.ticks ?? 0) > 0, `ticks=${b?.ticks}`);

    const shot = await send("Page.captureScreenshot", { format: "png" });
    const sample = await send("Runtime.evaluate", {
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
  } catch (err) {
    check(`cdp error: ${err.message}`, false);
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
  process.exit(0);
};
