export const tagEditorTableClassName =
  'tags-inputs-table w-full border-separate border-spacing-y-0.5 text-zinc-900'

export const tagEditorLabelClassName = 'font-mono text-xs leading-tight text-zinc-950 select-none'

export const tagEditorLabelCellClassName =
  'max-sm:max-w-[30vw] max-sm:overflow-auto align-top py-0 pr-2'

export const tagEditorValueCellClassName = 'max-sm:max-w-[60vw] max-sm:overflow-auto align-top py-0'

export const tagEditorValueRowClassName = `${tagEditorValueCellClassName} flex items-center gap-1`

export const tagEditorValueStackClassName = `${tagEditorValueCellClassName} w-full min-w-0 flex flex-col items-stretch gap-1`

export const tagEditorCompactControlClassName = 'h-5 min-h-5 px-2 text-xs leading-tight'

export const tagEditorCompactFieldOverrides =
  '[&_input]:!h-5 [&_input]:!min-h-5 [&_input]:!py-0 [&_input]:!px-2 [&_input]:!text-xs [&_input]:!leading-tight [&_select]:!h-5 [&_select]:!min-h-5 [&_select]:!py-0 [&_select]:!px-2 [&_select]:!pr-7 [&_select]:!text-xs [&_select]:!leading-tight [&_svg]:!size-3'

/** Text inputs stay mono (raw OSM values). Selects use UI font for translated labels. */
export const tagEditorFieldClassName = `min-w-0 ${tagEditorCompactFieldOverrides} [&_[data-slot=control]]:before:rounded-sm [&_[data-slot=control]]:after:rounded-sm [&_input]:rounded-sm [&_select]:rounded-sm [&_input]:font-mono`

export const tagEditorConditionalConditionGroupClassName =
  'flex min-h-5 min-w-0 items-stretch overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-950/10'

export const tagEditorConditionalConditionPrefixClassName = `flex h-5 shrink-0 items-center self-start border-r border-zinc-950/10 bg-zinc-50 px-1.5 text-zinc-600 select-none ${tagEditorCompactControlClassName}`

export const tagEditorConditionalConditionInputClassName = `${tagEditorFieldClassName} min-w-0 flex-1 [&_[data-slot=control]]:before:hidden [&_[data-slot=control]]:after:hidden [&_textarea]:!h-auto [&_textarea]:!min-h-5 [&_textarea]:rounded-none [&_textarea]:border-0 [&_textarea]:!px-2 [&_textarea]:!py-0.5 [&_textarea]:shadow-none [&_textarea]:!text-xs [&_textarea]:!leading-tight [&_textarea]:resize-none [&_textarea]:overflow-hidden`

export const tagEditorValueButtonGroupClassName =
  'grid w-full grid-cols-3 gap-px overflow-hidden rounded-sm bg-zinc-950/10 ring-1 ring-zinc-950/10 [&>*]:min-w-0'

export const tagEditorValueButtonGroupCompactClassName =
  'inline-flex h-5 shrink-0 overflow-hidden rounded-sm bg-white ring-1 ring-zinc-950/10'

export const tagEditorToolbarButtonGroupClassName =
  'inline-flex h-10 shrink-0 overflow-hidden rounded-sm bg-white ring-1 ring-zinc-950/10'

/** Parking-position grid cell; wiki illustrations are landscape (~564×311). */
export const tagEditorParkingPositionButtonClassName =
  'relative flex h-12 w-full min-w-0 cursor-pointer items-center justify-center overflow-hidden bg-white p-0.5 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'

export const tagEditorToolbarButtonClassName =
  'flex h-10 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden bg-white px-0.5 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'

export const tagEditorValueButtonCompactClassName =
  'flex h-5 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden bg-white p-0.5 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'

export const tagEditorValueButtonIconClassName = 'block size-full object-contain'

export const tagEditorValueButtonIconCompactClassName = 'block size-full object-contain'

export const tagEditorValueButtonSelectedClassName =
  'bg-zinc-200 text-zinc-950 hover:bg-zinc-200 active:bg-zinc-200'

/** Soft highlight for OSM-implied defaults when the tag is unset (display-only). */
export const tagEditorValueButtonImpliedClassName =
  'bg-zinc-50 text-zinc-400 italic ring-1 ring-inset ring-dashed ring-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 active:bg-zinc-100'

export const tagEditorValueButtonDividerClassName = 'border-l border-zinc-950/10'

export const tagEditorYesNoButtonClassName = `flex shrink-0 cursor-pointer items-center justify-center bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 ${tagEditorCompactControlClassName}`
