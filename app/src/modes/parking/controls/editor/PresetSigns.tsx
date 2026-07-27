import * as m from '@app/paraglide/messages'
import { type OsmWay } from '@osm-editor-kit/osm-data'
import clsx from 'clsx'
import { Tooltip } from '../../../../components/Tooltip/Tooltip'
import { getPresetTitle } from '../../../../i18n/preset-labels'
import { floatingChromeElevationClassName } from '../../../../shell/map/mobileMapChrome.const'
import { type OsmKeyValue } from '../../../../utils/types/preset'
import { useParkingPresetSet } from '../../use-parking-preset-set'
import { getParkingPresets } from './presets'

const presetButtonClassName =
  'flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center bg-white px-1 text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50'

export function PresetSigns(props: {
  osm: OsmWay
  side: 'both' | 'left' | 'right'
  readOnly?: boolean
  onChange: (key: string, value: string) => void
}) {
  const readOnly = props.readOnly ?? false
  const { presetSet } = useParkingPresetSet()
  const presets = getParkingPresets(presetSet)

  return (
    <section aria-label={m.editor_sign_presets_aria()} className="mb-2">
      <div
        className={clsx('flex overflow-hidden rounded-md', floatingChromeElevationClassName)}
        role="group"
        aria-label={m.editor_sign_presets_aria()}
      >
        {presets.map((preset, index) => {
          const title = getPresetTitle(preset.key)
          return (
            <Tooltip key={preset.key} content={title} placement="top" wrapperClassName="shrink-0">
              <button
                type="button"
                aria-label={title}
                title={title}
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
          )
        })}
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
