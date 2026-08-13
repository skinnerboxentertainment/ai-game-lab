/**
 * Deterministic PRNG (mulberry32), as plain, serializable state rather than a
 * stateful closure. Same seed -> same sequence, forever — and unlike a
 * closure, `RngState` can be saved and resumed exactly where it left off,
 * which a "serializable GameState" has to be able to do.
 * The simulation core is the ONLY module allowed to call these.
 */
export interface RngState {
  a: number;
}

export function createRng(seed: number): RngState {
  return { a: seed >>> 0 };
}

export function nextRandom(state: RngState): [number, RngState] {
  let a = state.a | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, { a }];
}

export function nextRange(state: RngState, min: number, max: number): [number, RngState] {
  const [value, next] = nextRandom(state);
  return [min + (max - min) * value, next];
}
