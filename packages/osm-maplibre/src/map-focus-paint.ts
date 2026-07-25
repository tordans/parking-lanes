export const MAP_FOCUS_MUTED_COLOR = '#94a3b8'
export const MAP_FOCUS_MUTED_OPACITY = 0.3

export function focusCaseColor(
  matchExpression: unknown,
  activeColor: unknown,
  mutedColor: string = MAP_FOCUS_MUTED_COLOR,
): unknown {
  return ['case', matchExpression, activeColor, mutedColor]
}

export function focusCaseOpacity(
  matchExpression: unknown,
  activeOpacity: number,
  mutedOpacity: number = MAP_FOCUS_MUTED_OPACITY,
): unknown {
  return ['case', matchExpression, activeOpacity, mutedOpacity]
}
