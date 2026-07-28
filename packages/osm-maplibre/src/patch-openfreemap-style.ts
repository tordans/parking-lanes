import type { FilterSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl'

/**
 * TEMPORARY local patches for the OpenFreeMap Positron style.
 *
 * Remove this module (and `scripts/fetch-openfreemap-positron-style.ts`, the checked-in
 * `styles/openfreemap-positron.json`, and the predev fetch hook) once the CDN serves safe
 * filters for null feature props:
 * - https://github.com/hyperknot/openfreemap/issues/107
 * - https://github.com/hyperknot/openfreemap-styles/pull/18
 *
 * Prefer a static patched JSON over MapLibre `transformStyle` / mid-load `setStyle` — that
 * approach wiped custom layers (see dd768419).
 */

const NUMERIC_COMPARE = new Set(['>', '<', '>=', '<='])

/** Sentinels that make null/missing props fail the comparison (JSON has no ±Infinity). */
const SENTINEL_HIGH = 1e18
const SENTINEL_LOW = -1e18

function isGetProp(expr: unknown): expr is ['get', string] {
  return (
    Array.isArray(expr) && expr[0] === 'get' && typeof expr[1] === 'string' && expr.length === 2
  )
}

function isCoalescedGet(expr: unknown): boolean {
  return (
    Array.isArray(expr) &&
    expr[0] === 'coalesce' &&
    expr.length >= 3 &&
    isGetProp(expr[1]) &&
    typeof expr[2] === 'number'
  )
}

/**
 * Rewrite `['>='|'<='|'>'|'<', ['get', prop], number]` so null props do not throw
 * "Expected value to be of type number, but found null instead."
 */
function patchFilterExpression(expr: unknown): unknown {
  if (!Array.isArray(expr) || expr.length === 0) return expr

  const op = expr[0]
  if (typeof op !== 'string') return expr

  if (NUMERIC_COMPARE.has(op) && expr.length === 3) {
    const left = expr[1]
    const right = expr[2]

    if (isGetProp(left) && typeof right === 'number') {
      const sentinel = op === '<=' || op === '<' ? SENTINEL_HIGH : SENTINEL_LOW
      return [op, ['coalesce', left, sentinel], right]
    }

    if (isCoalescedGet(left) && typeof right === 'number') {
      return expr
    }

    if (typeof left === 'number' && isGetProp(right)) {
      const sentinel = op === '<=' || op === '<' ? SENTINEL_LOW : SENTINEL_HIGH
      return [op, left, ['coalesce', right, sentinel]]
    }

    if (typeof left === 'number' && isCoalescedGet(right)) {
      return expr
    }
  }

  return [op, ...expr.slice(1).map(patchFilterExpression)]
}

function patchLayerFilter(layer: LayerSpecification): LayerSpecification {
  if (!('filter' in layer) || layer.filter == null) return layer

  const next = patchFilterExpression(layer.filter) as FilterSpecification
  if (JSON.stringify(next) === JSON.stringify(layer.filter)) return layer
  return { ...layer, filter: next }
}

/**
 * Null-safe numeric filters across Positron layers (`admin_level`, `ref_length`, `rank`, …).
 * Broader than openfreemap-styles#18 (`boundary_3` only) — CDN still ships other unsafe compares.
 */
export function patchOpenFreeMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map(patchLayerFilter),
  }
}
