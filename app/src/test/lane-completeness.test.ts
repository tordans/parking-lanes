import { describe, expect, test } from 'bun:test'
import type { LaneSlot } from '@osm-editor-kit/osm-lanes'
import { crossSectionDisplaySlots } from '../modes/lanes/domain/display-order'
import { isDeemphasizedHighway, laneCompleteness } from '../modes/lanes/domain/lane-completeness'

describe('laneCompleteness', () => {
  test('none when no lane count tags', () => {
    expect(laneCompleteness({ highway: 'primary' })).toBe('none')
  })

  test('count-only when only lanes tag present', () => {
    expect(laneCompleteness({ lanes: '2' })).toBe('count-only')
  })

  test('rich when turn pipes present', () => {
    expect(laneCompleteness({ lanes: '2', 'turn:lanes': 'left|through|right' })).toBe('rich')
  })
})

describe('isDeemphasizedHighway', () => {
  test('service and living_street are deemphasized', () => {
    expect(isDeemphasizedHighway('service')).toBe(true)
    expect(isDeemphasizedHighway('living_street')).toBe(true)
    expect(isDeemphasizedHighway('primary')).toBe(false)
  })
})

describe('crossSectionDisplaySlots', () => {
  test('reverses backward slots for physical left-to-right display', () => {
    const slots: LaneSlot[] = [
      { index: 0, direction: 'forward', kind: 'travel', provenance: defaultProv() },
      { index: 1, direction: 'forward', kind: 'travel', provenance: defaultProv() },
      { index: 0, direction: 'backward', kind: 'travel', provenance: defaultProv() },
      { index: 1, direction: 'backward', kind: 'travel', provenance: defaultProv() },
    ]

    const display = crossSectionDisplaySlots(slots)
    expect(display.map((s) => `${s.direction}:${s.index}`)).toEqual([
      'backward:1',
      'backward:0',
      'forward:0',
      'forward:1',
    ])
  })
})

function defaultProv(): LaneSlot['provenance'] {
  return {
    count: 'default',
    turn: 'default',
    vehicleAccess: 'default',
    bicycleAccess: 'default',
    busAccess: 'default',
    psvAccess: 'default',
    widthMeters: 'default',
    change: 'default',
    surface: 'default',
    smoothness: 'default',
    kind: 'default',
  }
}
