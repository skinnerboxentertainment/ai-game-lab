import { Container, Text } from "pixi.js";
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, FONT_FAMILY } from "../config/display";
import type { Disposable } from "../core/Disposable";

const UPDATE_INTERVAL = 0.5;

/**
 * Minimal bottom-right status line. Re-renders at 2 Hz to avoid per-frame Text
 * re-rasterization cost.
 */
export class StatsLine implements Disposable {
  readonly container: Container;

  private readonly text: Text;
  private elapsed = 0;
  private frames = 0;
  private fps = 0;

  constructor(
    parent: Container,
    private readonly getTicks: () => number,
    private readonly seed: number,
  ) {
    this.container = new Container({ label: "uiLayer" });
    this.text = new Text({
      text: "",
      style: { fontFamily: FONT_FAMILY, fontSize: 14, fill: 0x9fff9f },
    });
    this.text.anchor.set(1, 1);
    this.text.position.set(LOGICAL_WIDTH - 14, LOGICAL_HEIGHT - 10);
    this.container.addChild(this.text);
    parent.addChild(this.container);
    this.refresh();
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.frames++;
    if (this.elapsed >= UPDATE_INTERVAL) {
      this.fps = this.frames / this.elapsed;
      this.frames = 0;
      this.elapsed = 0;
      this.refresh();
    }
  }

  private refresh(): void {
    this.text.text =
      `FPS ${this.fps.toFixed(0)} · TICKS ${this.getTicks()} · SEED ${this.seed}`;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
