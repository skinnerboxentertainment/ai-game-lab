import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import type { FederatedPointerEvent } from "pixi.js";
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from "../config/display";
import { createGameState, applyAction, TICK } from "../state/core";
import type { GameState, Particle, SimBounds } from "../state/core";
import { addParticle, createEcsWorld, Position, stepAll } from "../ecs/world";
import { accumulate } from "../core/fixedstep";
import type { IWorld } from "bitecs";
import { hslToRgb, makeDotTexture } from "../utils/color";
import type { Disposable } from "../core/Disposable";

const PARTICLE_COUNT = 140;
const BURST_COUNT = 20;

/**
 * Demo scene: a deterministic particle drift driven by the pure core through a
 * bitECS layer, rendered with PixiJS sprites. Fixed timestep (1/60) so the sim
 * is deterministic regardless of frame rate; the seed comes from ?seed=.
 *
 * Click to dispatch a SPAWN_BURST action — the one place this scene routes a
 * discrete event through `(state, action) -> newState` instead of continuous
 * per-frame stepping. Per-frame position updates still flow through the ECS
 * layer (`stepAll`), matching "ecs/world.ts drives the pure core"; `state`
 * tracks spawn history + RNG + tick bookkeeping, not live position — that's
 * an intentional, minimal-footprint split, not an oversight.
 */
export class ParticleGalaxy implements Disposable {
  readonly container: Container;

  private readonly world: IWorld;
  private readonly dot: Texture;
  private readonly sprites: Sprite[] = [];
  private readonly entities: number[] = [];
  private readonly bounds: SimBounds = {
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
  };
  private accumulator = 0;
  private tickCount = 0;
  private state: GameState;
  /** Exposed so scripts/verify.mjs can read the real value off the live
   * page instead of duplicating the number — a hardcoded copy in a second
   * file is exactly the kind of thing that quietly drifts out of sync. */
  readonly burstCount = BURST_COUNT;

  constructor(parent: Container, seed: number) {
    this.container = new Container({ label: "sceneLayer" });
    this.dot = Texture.from(makeDotTexture(4));
    this.world = createEcsWorld();

    this.state = createGameState(seed, PARTICLE_COUNT, this.bounds);
    for (const p of this.state.particles) {
      this.addParticleVisual(p);
    }

    // Pixi's own event system, not a raw DOM listener (per
    // docs/packs/pixijs-lab-pack.md: "scenes never register their own DOM
    // listeners"); one scene is ever active in this starter, so wiring input
    // directly on its container satisfies "one InputManager" in spirit
    // without building a separate class this demo doesn't need.
    this.container.eventMode = "static";
    this.container.hitArea = new Rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.container.on("pointerdown", this.onPointerDown);

    parent.addChild(this.container);
  }

  get ticks(): number {
    return this.tickCount;
  }

  update(dt: number): void {
    const { steps, remainder } = accumulate(this.accumulator + dt, TICK, 8);
    this.accumulator = remainder;
    for (let i = 0; i < steps; i++) {
      this.step(TICK);
    }
  }

  private step(dt: number): void {
    stepAll(this.entities, dt, this.bounds);
    this.tickCount++;
    for (let i = 0; i < this.entities.length; i++) {
      this.sprites[i].position.set(
        Position.x[this.entities[i]],
        Position.y[this.entities[i]],
      );
    }
  }

  private readonly onPointerDown = (event: FederatedPointerEvent): void => {
    const { x, y } = event.getLocalPosition(this.container);
    const spawnedFrom = this.state.particles.length;
    this.state = applyAction(this.state, {
      type: "SPAWN_BURST",
      x,
      y,
      count: BURST_COUNT,
    });
    for (const p of this.state.particles.slice(spawnedFrom)) {
      this.addParticleVisual(p);
    }
  };

  private addParticleVisual(p: Particle): void {
    const scale = 0.5 + p.hue * 0.9;
    const eid = addParticle(this.world, p, scale);
    this.entities.push(eid);
    const sprite = new Sprite(this.dot);
    sprite.anchor.set(0.5);
    sprite.position.set(p.x, p.y);
    sprite.tint = hslToRgb(p.hue, 0.75, 0.6);
    sprite.scale.set(scale);
    this.container.addChild(sprite);
    this.sprites.push(sprite);
  }

  destroy(): void {
    this.container.off("pointerdown", this.onPointerDown);
    this.dot.destroy(true);
    this.container.destroy({ children: true });
  }
}
