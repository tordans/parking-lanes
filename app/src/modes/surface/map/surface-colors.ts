import { MISSING_DATA_PINK } from '../../../shell/map/missing-data-paint'

export const SMOOTHNESS_COLORS = {
  very_bad: '#d8035c',
  bad: '#f90606',
  intermediate: '#faa00f',
  good: '#b5ea2e',
  excellent: '#37f644',
} as const

export const MISSING_SMOOTHNESS_BASE_COLOR = '#9ca3af'
export const MISSING_SURFACE_COLOR = MISSING_DATA_PINK
export const MISSING_SMOOTHNESS_OVERLAY_COLOR = '#000000'

export const surfaceLegendItems = [
  {
    id: 'missing_surface',
    color: MISSING_DATA_PINK,
    label: 'Missing data',
    missing: true,
  },
  {
    id: 'missing_smoothness',
    color: MISSING_SMOOTHNESS_BASE_COLOR,
    label: 'Surface present, smoothness missing',
    dotted: true,
  },
  {
    id: 'very_bad',
    color: SMOOTHNESS_COLORS.very_bad,
    label: 'smoothness=very_bad',
  },
  {
    id: 'bad',
    color: SMOOTHNESS_COLORS.bad,
    label: 'smoothness=bad',
  },
  {
    id: 'intermediate',
    color: SMOOTHNESS_COLORS.intermediate,
    label: 'smoothness=intermediate',
  },
  {
    id: 'good',
    color: SMOOTHNESS_COLORS.good,
    label: 'smoothness=good',
  },
  {
    id: 'excellent',
    color: SMOOTHNESS_COLORS.excellent,
    label: 'smoothness=excellent',
  },
] as const
