import { Container, Graphics, Point } from "pixi.js";
import type { Application } from "pixi.js";
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from "../config/display";
import { containScale } from "./containScale";
import type { Disposable } from "./Disposable";

export interface ViewportStats {
  logicalWidth: number;
  logicalHeight: number;
  /** CSS-pixel size of the renderer screen (`renderer.screen`). */
  screenWidth: number;
  screenHeight: number;
  /** Uniform contain scale applied to the logical stage. */
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Owns the stage: only `viewportRoot` is scaled/centered on resize. Scale math
 * always uses `renderer.screen` (CSS px), never `renderer.width` (physical).
 */
export class Viewport implements Disposable {
  readonly root: Container;
  readonly letterbox: Graphics;

  private readonly app: Application;
  private current: ViewportStats;
  private readonly onResize: () => void;

  constructor(app: Application) {
    this.app = app;
    this.root = new Container({ label: "viewportRoot" });
    this.letterbox = new Graphics({ label: "letterboxLayer" });
    app.stage.addChild(this.letterbox, this.root);

    this.current = this.readStats();
    this.onResize = (): void => this.applyResize();
    this.app.renderer.on("resize", this.onResize);
    this.applyResize();
  }

  get stats(): ViewportStats {
    return this.current;
  }

  private readStats(): ViewportStats {
    const w = this.app.renderer.screen.width;
    const h = this.app.renderer.screen.height;
    const cs = containScale(w, h, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    return {
      logicalWidth: LOGICAL_WIDTH,
      logicalHeight: LOGICAL_HEIGHT,
      screenWidth: w,
      screenHeight: h,
      scale: cs.scale,
      offsetX: cs.offsetX,
      offsetY: cs.offsetY,
    };
  }

  private applyResize(): void {
    const s = this.readStats();
    this.root.scale.set(s.scale);
    this.root.position.set(s.offsetX, s.offsetY);
    // Clear before redraw so repeated resizes never accumulate geometry.
    this.letterbox.clear();
    this.letterbox.rect(0, 0, s.screenWidth, s.screenHeight).fill({
      color: 0x000000,
      alpha: 0,
    });
    this.current = s;
  }

  /** Global (CSS-px) -> logical 1280×720 coords, accounting for scale/letterbox. */
  globalToLogical(globalX: number, globalY: number): Point {
    return this.root.toLocal(new Point(globalX, globalY));
  }

  destroy(): void {
    this.app.renderer.off("resize", this.onResize);
    this.root.destroy({ children: true });
    this.letterbox.destroy();
  }
}
