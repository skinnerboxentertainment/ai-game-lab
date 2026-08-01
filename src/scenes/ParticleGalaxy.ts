import { Container, Sprite, Texture } from "pixi.js";
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from "../config/display";
import { seedParticles, TICK } from "../state/core";
import type { SimBounds } from "../state/core";
import { addParticle, createEcsWorld, Position, stepAll } from "../ecs/world";
import type { IWorld } from "bitecs";
import { hslToRgb, makeDotTexture } from "../utils/color";
import type { Disposable } from "../core/Disposable";

const PARTICLE_COUNT = 140;

/**
 * Demo scene: a deterministic particle drift driven by the pure core through a
 * bitECS layer, rendered with PixiJS sprites. Fixed timestep (1/60) so the sim
 * is deterministic regardless of frame rate; the seed comes from ?seed=.
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

  constructor(parent: Container, seed: number) {
    this.container = new Container({ label: "sceneLayer" });
    this.dot = Texture.from(makeDotTexture(4));
    this.world = createEcsWorld();

    const particles = seedParticles(seed, PARTICLE_COUNT, this.bounds);
    for (const p of particles) {
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

    parent.addChild(this.container);
  }

  get ticks(): number {
    return this.tickCount;
  }

  update(dt: number): void {
    this.accumulator += dt;
    let guard = 0;
    while (this.accumulator >= TICK && guard < 8) {
      this.step(TICK);
      this.accumulator -= TICK;
      guard++;
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

  destroy(): void {
    this.dot.destroy(true);
    this.container.destroy({ children: true });
  }
}
