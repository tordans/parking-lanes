import { parkingSideColors } from '../../parking/side-colors'

/** Map band colors for tagged vs fallback highway widths. */
export const WIDTH_KIND_COLORS = {
  /** `width` or `est_width` present and parseable. */
  explicit: '#0f766e',
  /** No width tag — value from highway default tables. */
  default: '#b45309',
} as const

/** Selection chrome — grab handles use parking right-side orange. */
export const WIDTH_SELECTION_COLORS = {
  /** Grab handles and selected band (parking right). */
  accent: parkingSideColors.right,
} as const

export const widthLegendItems = [
  {
    kind: 'explicit',
    color: WIDTH_KIND_COLORS.explicit,
    before: 'Tagged',
    tags: ['width', 'est_width'],
  },
  {
    kind: 'default',
    color: WIDTH_KIND_COLORS.default,
    before: 'Default from',
    tags: ['highway'],
    after: 'type',
  },
] as const
