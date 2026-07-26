import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl'

export const lanesLineLayout = {
  'line-cap': 'round' as const,
  'line-join': 'round' as const,
}

export const lanesHitAreaPaint = {
  'line-width': 16,
  'line-opacity': 0,
}

const completenessColor: DataDrivenPropertyValueSpecification<string> = [
  'match',
  ['get', 'completeness'],
  'rich',
  '#16a34a',
  'count-only',
  '#ca8a04',
  '#a1a1aa',
]

export const lanesBandPaint = {
  'line-width': [
    'interpolate',
    ['linear'],
    ['zoom'],
    12,
    2,
    16,
    6,
    20,
    12,
  ] as DataDrivenPropertyValueSpecification<number>,
  'line-opacity': [
    'case',
    ['get', 'deemphasized'],
    0.35,
    0.75,
  ] as DataDrivenPropertyValueSpecification<number>,
  'line-color': completenessColor,
  'line-blur': 0,
}

export const lanesNeighborPaint = {
  'line-width': [
    'interpolate',
    ['linear'],
    ['zoom'],
    12,
    3,
    16,
    8,
    20,
    14,
  ] as DataDrivenPropertyValueSpecification<number>,
  'line-opacity': 0.9,
}

export const lanesPrevNeighborColor = '#ea580c'
export const lanesNextNeighborColor = '#7c3aed'
export const lanesSelectedColor = '#2563eb'
