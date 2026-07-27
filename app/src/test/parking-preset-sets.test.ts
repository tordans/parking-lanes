import { describe, expect, test } from 'bun:test'
import { getParkingPresets } from '../modes/parking/domain/editor/preset-sets'
import { readParkingPresetSet } from '../modes/parking/parking-preset-set-state'
import { serializeMapSearch } from '../shell/map/search-schema'

describe('parking preset sets', () => {
  test('default set is minimal', () => {
    expect(getParkingPresets('default').map((preset) => preset.key)).toEqual([
      'noStopping',
      'noParking',
    ])
  })

  test('russia set includes sign presets', () => {
    expect(getParkingPresets('russia').map((preset) => preset.key)).toEqual([
      'noStopping',
      'noParking',
      'noParkingOdd',
      'noParkingEven',
      'parking',
      'ticket',
    ])
  })

  test('readParkingPresetSet falls back to default', () => {
    expect(readParkingPresetSet(undefined)).toBe('default')
    expect(readParkingPresetSet('russia')).toBe('russia')
  })

  test('serializeMapSearch omits default preset set', () => {
    expect(serializeMapSearch({ presets: 'default' })).toEqual({})
    expect(serializeMapSearch({ presets: 'russia' })).toEqual({ presets: 'russia' })
  })
})
