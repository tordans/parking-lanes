export const coverageOutlinePaint = {
  'line-color': '#475569',
  'line-width': 1.5,
  'line-opacity': 0.45,
  'line-dasharray': [2, 2],
} as Record<string, unknown>

export const coverageFetchFillPaint = {
  'fill-color': ['get', 'color'],
  'fill-opacity': ['case', ['==', ['get', 'highlighted'], 1], 0.45, 0.22],
} as Record<string, unknown>

export const coverageFetchLinePaint = {
  'line-color': ['get', 'color'],
  'line-width': ['case', ['==', ['get', 'highlighted'], 1], 2.5, 1.25],
  'line-opacity': ['case', ['==', ['get', 'highlighted'], 1], 1, 0.85],
} as Record<string, unknown>
