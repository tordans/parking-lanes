import { Scissors } from 'lucide-react'
import { Tooltip } from '../../../components/Tooltip/Tooltip'
import { modeIcons } from '../../../modes/mode-icons'
import { changeSourceLabel, type ChangeSource } from '../../../utils/changeset-message'

export function ChangeSourceIcon(props: { source: ChangeSource }) {
  const label = changeSourceLabel(props.source)
  const Icon = props.source === 'split' ? Scissors : modeIcons[props.source]

  return (
    <Tooltip content={label} placement="top">
      <span className="inline-flex text-zinc-500" aria-label={label}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
      </span>
    </Tooltip>
  )
}
