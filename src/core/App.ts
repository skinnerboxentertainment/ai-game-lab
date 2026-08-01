import { Application } from "pixi.js";
import { BACKGROUND_COLOR, MAX_DPR } from "../config/display";

/**
 * PixiJS v8 Application. The renderer fills the browser viewport; the demo
 * scene stays authored in the fixed logical coordinate system owned by
 * `Viewport`. Pinned to WebGL so GLSL-only shaders are usable.
 */
export async function createApp(host: HTMLElement): Promise<Application> {
  const app = new Application();

  await app.init({
    resizeTo: window,
    background: BACKGROUND_COLOR,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, MAX_DPR),
    preference: "webgl",
    eventFeatures: {
      move: true,
      globalMove: true,
      click: true,
      wheel: false,
    },
  });

  host.appendChild(app.canvas);

  return app;
}
