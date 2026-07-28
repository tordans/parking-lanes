export const lanesLegendItems = [
  {
    id: 'none',
    color: '#ec4899',
    label: 'Missing data',
    missing: true,
  },
  {
    id: 'count-only',
    color: '#ca8a04',
    label: 'Lane count only (lanes=*)',
  },
  {
    id: 'rich',
    color: '#16a34a',
    label: 'Rich tagging (turn/access pipes)',
  },
] as const
