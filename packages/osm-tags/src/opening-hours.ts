import OpeningHours, { type opening_hours_warning } from 'opening_hours'

export type OpeningHoursStructuredWarning = opening_hours_warning

export type OpeningHoursParseDiagnostics = {
  warnings: OpeningHoursStructuredWarning[]
  error: string | null
}

function parseOddEvenDays(value: string): 'even' | 'odd' | null {
  if (!/\d+-\d+\/\d+$/.test(value)) return null

  // @ts-expect-error match is guaranteed by the regex above
  return parseInt(value.match(/\d+/g)[0]) % 2 === 0 ? 'even' : 'odd'
}

function createOpeningHours(value: string): {
  hours: OpeningHours | null
  diagnostics: OpeningHoursParseDiagnostics
} {
  try {
    const hours = new OpeningHours(value, null, 0)
    return {
      hours,
      diagnostics: {
        warnings: hours.getStructuredWarnings(),
        error: null,
      },
    }
  } catch (error) {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Invalid opening hours value'

    return {
      hours: null,
      diagnostics: {
        warnings: [],
        error: message,
      },
    }
  }
}

export function getOpeningHoursWarnings(interval: OpeningHours): OpeningHoursStructuredWarning[] {
  return interval.getStructuredWarnings()
}

export function parseOpeningHoursDiagnostics(
  value: string | null,
): OpeningHoursParseDiagnostics | null {
  if (value == null) return null

  const oddEven = parseOddEvenDays(value)
  if (oddEven != null) {
    return { warnings: [], error: null }
  }

  return createOpeningHours(value).diagnostics
}

export function parseOpeningHours(value: string | null): OpeningHours | 'even' | 'odd' | null {
  if (value == null) return null

  const oddEven = parseOddEvenDays(value)
  if (oddEven != null) return oddEven

  return createOpeningHours(value).hours
}

export function getOpeningHourseState(
  interval: OpeningHours | 'even' | 'odd',
  timestamp: Date,
): boolean {
  switch (interval) {
    case 'even':
      return timestamp.getDate() % 2 === 0

    case 'odd':
      return timestamp.getDate() % 2 === 1

    case null:
      return false

    default:
      return interval.getState(timestamp)
  }
}
