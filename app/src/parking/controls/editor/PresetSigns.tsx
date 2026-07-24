import { type OsmWay } from '../../../utils/types/osm-data'
import { type OsmKeyValue } from '../../../utils/types/preset'
import { presets } from './presets'

export function PresetSigns(props: {
  osm: OsmWay
  side: 'both' | 'left' | 'right'
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="preset-signs">
      {presets.map((preset) => (
        <img
          src={preset.img.src}
          key={preset.img.src}
          className="sign-preset"
          height={preset.img.height}
          width={preset.img.width}
          alt={preset.img.alt}
          title={preset.img.title}
          onClick={() => applyPreset(preset.tags, props.side, props.onChange)}
        />
      ))}
    </div>
  )
}

function applyPreset(
  tags: OsmKeyValue[],
  side: 'both' | 'left' | 'right',
  onChange: (key: string, value: string) => void,
) {
  for (const tag of tags) {
    const key = tag.k.replace('{side}', side)
    onChange(key, tag.v)
  }
}
