import * as m from '@app/paraglide/messages'
import { Label } from '../../../components/catalyst/fieldset'
import { Radio, RadioField, RadioGroup } from '../../../components/catalyst/radio'
import { parkingPresetSetIds, type ParkingPresetSetId } from '../domain/editor/preset-sets'
import { useParkingPresetSet } from '../use-parking-preset-set'

const presetSetLabels: Record<ParkingPresetSetId, () => string> = {
  default: m.parking_preset_set_default,
  russia: m.parking_preset_set_russia,
}

export function ParkingPresetSetSwitcher() {
  const { presetSet, setPresetSet } = useParkingPresetSet()

  return (
    <RadioGroup
      value={presetSet}
      onChange={(value) => setPresetSet(value as ParkingPresetSetId)}
      aria-label={m.parking_preset_set_title()}
      className="!flex !flex-row !flex-wrap !items-center !gap-x-4 !gap-y-2 !space-y-0"
    >
      {parkingPresetSetIds.map((setId) => (
        <RadioField key={setId} className="!grid-cols-[1.125rem_auto] sm:!grid-cols-[1rem_auto]">
          <Radio value={setId} color="dark/zinc" />
          <Label>{presetSetLabels[setId]()}</Label>
        </RadioField>
      ))}
    </RadioGroup>
  )
}
