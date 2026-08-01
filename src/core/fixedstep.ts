/**
 * Fixed-timestep accumulator. Consumes `dt` against a fixed tick and returns how
 * many steps to run (bounded by `maxSteps` so a slow frame cannot spiral). Pure
 * and unit-testable; the scene's update loop uses the returned remainder.
 */
export interface StepResult {
  /** Number of fixed steps that should run this frame. */
  steps: number;
  /** Unconsumed time to carry into the next frame. */
  remainder: number;
}

export function accumulate(dt: number, tick: number, maxSteps: number): StepResult {
  let accumulator = dt;
  let steps = 0;
  while (accumulator >= tick && steps < maxSteps) {
    accumulator -= tick;
    steps++;
  }
  return { steps, remainder: accumulator };
}
