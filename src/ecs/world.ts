import { addComponent, addEntity, createWorld, defineComponent, Types } from "bitecs";
import type { IWorld } from "bitecs";
import { stepParticle } from "../state/core";
import type { Particle, SimBounds } from "../state/core";
// NOTE: bitecs pinned to 0.3.x API (defineComponent/Types). 0.4.0 is a full
// rewrite; upgrade deliberately with tests once its API is proven.

export const Position = defineComponent({ x: Types.f32, y: Types.f32 });
export const Velocity = defineComponent({ vx: Types.f32, vy: Types.f32 });
export const ParticleData = defineComponent({ hue: Types.f32, scale: Types.f32 });

export function createEcsWorld(): IWorld {
  return createWorld();
}

export function addParticle(world: IWorld, p: Particle, scale: number): number {
  const eid = addEntity(world);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, ParticleData, eid);
  Position.x[eid] = p.x;
  Position.y[eid] = p.y;
  Velocity.vx[eid] = p.vx;
  Velocity.vy[eid] = p.vy;
  ParticleData.hue[eid] = p.hue;
  ParticleData.scale[eid] = scale;
  return eid;
}

/**
 * Steps every entity through the PURE core. The ECS layer only stores/iterates
 * component data and calls src/state/core.ts — no sim math lives here.
 */
export function stepAll(
  entities: number[],
  dt: number,
  bounds: SimBounds,
): void {
  for (const eid of entities) {
    const next = stepParticle(
      {
        x: Position.x[eid],
        y: Position.y[eid],
        vx: Velocity.vx[eid],
        vy: Velocity.vy[eid],
        hue: ParticleData.hue[eid],
      },
      dt,
      bounds,
    );
    Position.x[eid] = next.x;
    Position.y[eid] = next.y;
    Velocity.vx[eid] = next.vx;
    Velocity.vy[eid] = next.vy;
  }
}
