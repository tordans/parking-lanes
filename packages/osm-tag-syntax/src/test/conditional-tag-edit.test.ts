import {
  buildConditionalTagValue,
  formatConditionalValue,
  parseConditionalTagForEdit,
} from '../conditional-tag-edit'

describe('conditional tag edit', () => {
  test('formatConditionalValue adds brackets when condition is present', () => {
    expect(formatConditionalValue('free', 'Mo-Fr 09:00-19:00')).toBe('free @ (Mo-Fr 09:00-19:00)')
    expect(formatConditionalValue('ticket', null)).toBe('ticket')
    expect(formatConditionalValue('ticket', '')).toBe('ticket')
  })

  test('parseConditionalTagForEdit appends empty editable slot', () => {
    expect(parseConditionalTagForEdit('free @ (Mo-Fr 09:00-19:00)')).toStrictEqual([
      { value: 'free', condition: 'Mo-Fr 09:00-19:00' },
      { value: '', condition: null },
    ])
    expect(parseConditionalTagForEdit(undefined)).toStrictEqual([{ value: '', condition: null }])
  })

  test('buildConditionalTagValue rebuilds tag from edited part', () => {
    const parsed = parseConditionalTagForEdit('free @ (Mo-Fr 09:00-19:00); ticket @ 19:00-20:00')

    expect(
      buildConditionalTagValue(parsed, { value: 'disc', condition: 'Sa 08:00-15:00' }, 1),
    ).toBe('free @ (Mo-Fr 09:00-19:00); disc @ (Sa 08:00-15:00)')

    expect(buildConditionalTagValue(parsed, { value: '', condition: 'Mo' }, 0)).toBe(
      'ticket @ (19:00-20:00)',
    )
  })
})
