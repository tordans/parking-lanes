import { type OsmWay } from '@osm-editor-kit/osm-data'
import clsx from 'clsx'
import { Tooltip } from '../../../../components/Tooltip/Tooltip'
import { floatingChromeElevationClassName } from '../../../../shell/map/mobileMapChrome.const'
import { type OsmKeyValue } from '../../../../utils/types/preset'
import { presets } from './presets'

const presetButtonClassName =
  'flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center bg-white px-1 text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50'

export function PresetSigns(props: {
  osm: OsmWay
  side: 'both' | 'left' | 'right'
  readOnly?: boolean
  onChange: (key: string, value: string) => void
}) {
  const readOnly = props.readOnly ?? false

  return (
    <section aria-label="Sign presets" className="mb-2">
      <div
        className={clsx('flex overflow-hidden rounded-md', floatingChromeElevationClassName)}
        role="group"
        aria-label="Sign presets"
      >
        {presets.map((preset, index) => (
          <Tooltip
            key={preset.key}
            content={preset.img.title}
            placement="top"
            wrapperClassName="shrink-0"
          >
            <button
              type="button"
              aria-label={preset.img.alt}
              title={preset.img.title}
              disabled={readOnly}
              className={clsx(presetButtonClassName, index > 0 && 'border-l border-zinc-950/10')}
              onClick={() => applyPreset(preset.tags, props.side, props.onChange)}
            >
              <img
                src={preset.img.src}
                alt=""
                className="block h-4 max-h-4 w-auto max-w-7 object-contain"
              />
            </button>
          </Tooltip>
        ))}
      </div>
    </section>
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
