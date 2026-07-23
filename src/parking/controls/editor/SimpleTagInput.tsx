import { Label } from '../../../components/catalyst/fieldset'
import { type OsmWay } from '../../../utils/types/osm-data'
import { type TagValue } from '../../../utils/types/parking'
import { SelectInput } from './SelectInput'
import { TextInput } from './TextInput'

export function SimpleTagInput(props: {
  osm: OsmWay
  tag: string
  label: string
  hide: boolean
  values?: TagValue[]
  onChange: (value: string) => void
}) {
  const value = props.osm.tags[props.tag]

  const buttons = props.values
    ?.filter((v) => v.imgSrc)
    .map((v) => (
      <button
        type="button"
        key={v.value}
        title={v.value}
        className="flex cursor-pointer items-center rounded border-2 bg-transparent p-0"
        style={{ borderColor: v.value === value ? 'dodgerblue' : 'transparent' }}
        onClick={(_e) => props.onChange(v.value)}
      >
        <img src={v.imgSrc} height="15" alt={v.value} />
      </button>
    ))

  return (
    <tr
      id={props.tag}
      className="tag-editor"
      style={{ display: props.hide && !value ? 'none' : undefined }}
    >
      <td className="align-baseline max-sm:max-w-[30vw] max-sm:overflow-auto">
        <Label title={props.tag}>{props.label}</Label>
      </td>
      <td className="flex items-center gap-1 max-sm:max-w-[60vw] max-sm:overflow-auto">
        {props.values ? (
          <SelectInput
            tag={props.tag}
            value={value}
            values={props.values}
            onChange={(e) => props.onChange(e)}
          />
        ) : (
          <TextInput tag={props.tag} value={value} onChange={(e) => props.onChange(e)} />
        )}
        {buttons}
      </td>
    </tr>
  )
}
