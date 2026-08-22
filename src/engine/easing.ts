export function linear(t: number): number {
  return t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

export function clampMinMax(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = (v - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, clamp01(t));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function easeInOutCubicLoop(t: number): number {
  return easeInOutCubic(t);
}
