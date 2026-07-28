export const BICYCLE_PAINT_COLORS = {
  complete: '#16a34a',
  incomplete: '#f59e0b',
  noInfra: '#ec4899',
  separateGeometry: '#6366f1',
  centerlinePresence: '#7c3aed',
} as const

export const bicycleLegendItems = [
  {
    paintState: 'complete',
    label: 'Complete bicycle infrastructure',
    color: BICYCLE_PAINT_COLORS.complete,
  },
  {
    paintState: 'incomplete',
    label: 'Incomplete / needs clarification',
    color: BICYCLE_PAINT_COLORS.incomplete,
  },
  {
    paintState: 'noInfra',
    label: 'No mapped infrastructure on this geometry',
    color: BICYCLE_PAINT_COLORS.noInfra,
    missing: true,
  },
  {
    paintState: 'separateGeometry',
    label: 'Separate geometry referenced (cycleway=separate)',
    color: BICYCLE_PAINT_COLORS.separateGeometry,
  },
  {
    paintState: 'centerlinePresence',
    label: 'Centerline presence (cycleway=bicycle use_sidepath / optional_sidepath)',
    color: BICYCLE_PAINT_COLORS.centerlinePresence,
  },
] as const
