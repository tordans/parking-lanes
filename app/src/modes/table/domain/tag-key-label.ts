import type { TableTagGroupId } from './tag-groups'

const conditionalLabelSuffix = ':conditional'
const conditionalLabelPrefixMaxLength = 6

/** Match parking editor: keep `:conditional`, ellipsis a long middle segment. */
export function compactConditionalTagLabel(label: string): string {
  if (!label.endsWith(conditionalLabelSuffix)) return label

  const prefix = label.slice(0, -conditionalLabelSuffix.length)
  if (prefix.length <= conditionalLabelPrefixMaxLength) return label

  return `${prefix.slice(0, conditionalLabelPrefixMaxLength)}…${conditionalLabelSuffix}`
}

/**
 * Drop the group/side context already shown by the disclosure heading
 * (and parking `parking:{side}` nesting), then compact long conditional keys.
 */
export function formatTableTagKeyLabel(key: string, groupId: TableTagGroupId): string {
  const stripped = stripContextualPrefix(key, groupId)
  return compactConditionalTagLabel(stripped.length > 0 ? stripped : key)
}

function stripContextualPrefix(key: string, groupId: TableTagGroupId): string {
  switch (groupId) {
    case 'bikelane_left':
      return stripSidepathNest(key, 'cycleway', 'left')
    case 'bikelane_right':
      return stripSidepathNest(key, 'cycleway', 'right')
    case 'sidewalk_left':
      return stripSidepathNest(key, 'sidewalk', 'left')
    case 'sidewalk_right':
      return stripSidepathNest(key, 'sidewalk', 'right')
    case 'centerline': {
      const parking = /^parking:(both|left|right)(?::(.*))?$/.exec(key)
      if (parking) return parking[2] || parking[1]!
      return key
    }
  }
}

function stripSidepathNest(
  key: string,
  prefix: 'cycleway' | 'sidewalk',
  side: 'left' | 'right',
): string {
  const note = new RegExp(`^note:${prefix}:${side}$`).exec(key)
  if (note) return 'note'

  const sourced = new RegExp(`^source:${prefix}:${side}(?::(.*))?$`).exec(key)
  if (sourced) return sourced[1] ? `source:${sourced[1]}` : 'source'

  const nested = new RegExp(`^${prefix}:${side}(?::(.*))?$`).exec(key)
  if (nested) return nested[1] || side

  return key
}
