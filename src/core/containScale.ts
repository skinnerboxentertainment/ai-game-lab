/**
 * Pure contain-scale math for the fixed logical stage. Kept side-effect free so
 * it can be unit-tested in Node (the Viewport applies the result).
 */
export interface ContainScale {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function containScale(
  screenW: number,
  screenH: number,
  logicalW: number,
  logicalH: number,
): ContainScale {
  const scale = Math.min(screenW / logicalW, screenH / logicalH);
  return {
    scale,
    offsetX: (screenW - logicalW * scale) / 2,
    offsetY: (screenH - logicalH * scale) / 2,
  };
}
