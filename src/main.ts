import "./styles/global.css";
import { createApp } from "./core/App";
import { Viewport } from "./core/Viewport";
import { ParticleGalaxy } from "./scenes/ParticleGalaxy";
import { StatsLine } from "./ui/StatsLine";

async function boot(): Promise<void> {
  const app = await createApp(document.body);
  const viewport = new Viewport(app);

  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get("seed")) || 1337;

  const scene = new ParticleGalaxy(viewport.root, seed);
  const stats = new StatsLine(viewport.root, () => scene.ticks, seed);

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    scene.update(dt);
    stats.update(dt);
  });

  (window as unknown as Record<string, unknown>).__demo = {
    app,
    viewport,
    scene,
    seed,
  };
}

boot().catch((err: unknown) => {
  console.error("Failed to start the lab demo:", err);
});
