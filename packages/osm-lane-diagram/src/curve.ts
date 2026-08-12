/** Shared S-curve sampling for transition-band edges (fills and strokes stay in lockstep). */

import { SEAM_OVERLAP_PX, TAPER_FRAC, TRANSITION_CURVE_SAMPLES } from './defaults'

const EPS = 0.01

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Hermite smoothstep: flat (vertical) tangents at t=0 and t=1. */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/**
 * Sample an S-curve from (x0,y0) → (x1,y1) with vertical tangents at both ends.
 * Y progresses linearly; X follows smoothstep. Includes endpoints.
 * When Δx ≈ 0, returns the two endpoints only.
 */
export function sampleSCurve(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  samples = 10,
): Array<{ x: number; y: number }> {
  if (Math.abs(y0 - y1) < EPS && Math.abs(x0 - x1) < EPS) {
    return [{ x: round2(x0), y: round2(y0) }]
  }
  if (Math.abs(x0 - x1) < EPS) {
    return [
      { x: round2(x0), y: round2(y0) },
      { x: round2(x1), y: round2(y1) },
    ]
  }
  const n = Math.max(2, samples)
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const e = smoothstep(t)
    out.push({
      x: round2(x0 + (x1 - x0) * e),
      y: round2(y0 + (y1 - y0) * t),
    })
  }
  return out
}

/**
 * Append an S-curve onto `points`, skipping the first sample when it matches the
 * last existing point (avoids duplicate seam vertices).
 */
export function appendSCurve(
  points: Array<{ x: number; y: number }>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  samples = 10,
): void {
  const curve = sampleSCurve(x0, y0, x1, y1, samples)
  for (let i = 0; i < curve.length; i++) {
    const p = curve[i]!
    const prev = points[points.length - 1]
    if (i === 0 && prev && Math.abs(prev.x - p.x) < EPS && Math.abs(prev.y - p.y) < EPS) {
      continue
    }
    points.push(p)
  }
}

/** Vertical extent with seam overlap so adjacent fills don't show page background. */
export function bandSeamExtent(
  bandIndex: number,
  bandCount: number,
  y: number,
  height: number,
): { y: number; height: number } {
  let top = y
  let h = height
  if (bandIndex > 0) {
    top -= SEAM_OVERLAP_PX / 2
    h += SEAM_OVERLAP_PX / 2
  }
  if (bandIndex < bandCount - 1) {
    h += SEAM_OVERLAP_PX / 2
  }
  return { y: round2(top), height: round2(h) }
}

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > EPS
}

export type MorphBandEdge = {
  y: number
  height: number
  x: number
  width?: number
  synthetic?: boolean
}

/**
 * Continuous vertical edge across bands — shared by kerbs, outer edges, and the
 * carriageway plate so fills and strokes cannot diverge.
 * Synthetic transition bands → S-curve morph. Width changes without glue → S-curve
 * taper on the wider band. Pure lateral shifts → square step. Square steps also
 * remain where neighbour data is missing.
 */
export function appendMorphingVerticalRun(
  points: Array<{ x: number; y: number }>,
  bandXs: MorphBandEdge[],
  side: 'left' | 'right',
): void {
  if (bandXs.length === 0) return

  const isWider = (a: number, b: number) => (side === 'right' ? a > b + EPS : a < b - EPS)
  const widthChanged = (a: { width?: number }, b: { width?: number }): boolean => {
    if (a.width == null || b.width == null) return true
    return differs(a.width, b.width)
  }

  for (let i = 0; i < bandXs.length; i++) {
    const band = bandXs[i]!
    const topY = round2(band.y)
    const botY = round2(band.y + band.height)
    const x = band.x
    const prev = bandXs[i - 1]
    const next = bandXs[i + 1]

    if (band.synthetic) {
      const topX = prev && !prev.synthetic ? prev.x : x
      const botX = next && !next.synthetic ? next.x : x
      if (!prev) points.push({ x: topX, y: topY })
      else if (!prev.synthetic) points.push({ x: prev.x, y: topY })
      appendSCurve(points, topX, topY, botX, botY, TRANSITION_CURVE_SAMPLES)
      continue
    }

    if (!prev) {
      points.push({ x, y: topY })
    } else if (prev.synthetic) {
      points.push({ x, y: topY })
    } else if (differs(prev.x, x)) {
      if (!widthChanged(prev, band)) {
        points.push({ x: prev.x, y: topY })
        points.push({ x, y: topY })
      } else if (isWider(x, prev.x)) {
        const taperY = round2(band.y + band.height * TAPER_FRAC)
        points.push({ x: prev.x, y: topY })
        appendSCurve(points, prev.x, topY, x, taperY, TRANSITION_CURVE_SAMPLES)
      } else {
        points.push({ x, y: topY })
      }
    }

    if (!next) {
      points.push({ x, y: botY })
    } else if (next.synthetic) {
      points.push({ x, y: botY })
    } else if (differs(next.x, x)) {
      if (!widthChanged(band, next)) {
        points.push({ x, y: botY })
      } else if (isWider(x, next.x)) {
        const taperY = round2(band.y + band.height * (1 - TAPER_FRAC))
        points.push({ x, y: taperY })
        appendSCurve(points, x, taperY, next.x, botY, TRANSITION_CURVE_SAMPLES)
      } else {
        points.push({ x, y: botY })
      }
    }
  }
}

/** Expand top/bottom vertices of a fill polygon to hide sub-pixel seam gaps. */
export function expandPolygonSeamOverlap(
  points: Array<{ x: number; y: number }>,
): Array<{ x: number; y: number }> {
  if (points.length === 0) return points
  const minY = Math.min(...points.map((p) => p.y))
  const maxY = Math.max(...points.map((p) => p.y))
  return points.map((p) => {
    if (Math.abs(p.y - minY) < EPS) return { x: p.x, y: round2(p.y - SEAM_OVERLAP_PX / 2) }
    if (Math.abs(p.y - maxY) < EPS) return { x: p.x, y: round2(p.y + SEAM_OVERLAP_PX / 2) }
    return p
  })
}
