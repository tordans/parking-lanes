import { type TagValue } from '../../../../utils/types/parking'

export const tagEditorTableClassName =
  'tags-inputs-table w-full border-separate border-spacing-y-0.5 text-zinc-900'

export const tagEditorLabelClassName = 'text-xs leading-tight text-zinc-950 select-none'

export const tagEditorLabelCellClassName =
  'max-sm:max-w-[30vw] max-sm:overflow-auto align-top py-0 pr-2'

export const tagEditorValueCellClassName = 'max-sm:max-w-[60vw] max-sm:overflow-auto align-top py-0'

export const tagEditorValueRowClassName = `${tagEditorValueCellClassName} flex items-center gap-1`

export const tagEditorValueStackClassName = `${tagEditorValueCellClassName} w-full min-w-0 flex flex-col items-stretch gap-1`

export const tagEditorCompactControlClassName = 'h-5 min-h-5 px-2 font-mono text-xs leading-tight'

export const tagEditorCompactFieldOverrides =
  '[&_input]:!h-5 [&_input]:!min-h-5 [&_input]:!py-0 [&_input]:!px-2 [&_input]:!text-xs [&_input]:!leading-tight [&_select]:!h-5 [&_select]:!min-h-5 [&_select]:!py-0 [&_select]:!px-2 [&_select]:!pr-7 [&_select]:!text-xs [&_select]:!leading-tight [&_svg]:!size-3'

export const tagEditorFieldClassName = `min-w-0 ${tagEditorCompactFieldOverrides} [&_[data-slot=control]]:before:rounded-sm [&_[data-slot=control]]:after:rounded-sm [&_input]:rounded-sm [&_select]:rounded-sm [&_input]:font-mono [&_select]:font-mono`

export const tagEditorConditionalConditionGroupClassName =
  'flex h-5 min-w-0 overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-950/10'

export const tagEditorConditionalConditionPrefixClassName = `flex shrink-0 items-center border-r border-zinc-950/10 bg-zinc-50 px-1.5 text-zinc-600 select-none ${tagEditorCompactControlClassName}`

export const tagEditorConditionalConditionInputClassName = `${tagEditorFieldClassName} min-w-0 flex-1 [&_[data-slot=control]]:before:hidden [&_[data-slot=control]]:after:hidden [&_input]:rounded-none [&_input]:border-0 [&_input]:shadow-none`

export const tagEditorValueButtonGroupClassName =
  'flex w-full overflow-x-auto overflow-y-hidden rounded-sm bg-white ring-1 ring-zinc-950/10'

export const tagEditorValueButtonGroupCompactClassName =
  'inline-flex h-5 shrink-0 overflow-hidden rounded-sm bg-white ring-1 ring-zinc-950/10'

export const tagEditorToolbarButtonGroupClassName =
  'inline-flex h-10 shrink-0 overflow-hidden rounded-sm bg-white ring-1 ring-zinc-950/10'

export const tagEditorParkingPositionButtonClassName =
  'flex h-10 w-9 shrink-0 cursor-pointer items-center justify-center bg-white px-0.5 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'

export const tagEditorToolbarButtonClassName = tagEditorParkingPositionButtonClassName

export const tagEditorValueButtonCompactClassName =
  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden bg-white p-0 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'

export const tagEditorValueButtonIconClassName =
  'block h-[1.8rem] max-h-[1.8rem] w-auto max-w-[2.5rem] object-contain'

export const tagEditorValueButtonIconCompactClassName = 'block size-full object-cover'

export const tagEditorValueButtonSelectedClassName =
  'bg-zinc-200 text-zinc-950 hover:bg-zinc-200 active:bg-zinc-200'

export const tagEditorValueButtonDividerClassName = 'border-l border-zinc-950/10'

export const tagEditorYesNoButtonClassName = `flex shrink-0 cursor-pointer items-center justify-center bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 ${tagEditorCompactControlClassName}`

/** Main parking side tag only (`parking:both`, `parking:left`, `parking:right`). */
export function usesParkingPositionButtonGroup(tag: string): boolean {
  return /^parking:(both|left|right)$/.test(tag)
}

export function isYesNoTagValues(values: TagValue[] | undefined): boolean {
  if (!values || values.length !== 2) return false

  const options = new Set(values.map((entry) => entry.value))
  return options.has('yes') && options.has('no')
}
