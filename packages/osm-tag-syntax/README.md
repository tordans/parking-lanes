# `@osm-editor-kit/osm-tag-syntax`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

Parse and format OSM tag values that use structured mini-languages: conditional tags (`value @ (condition); …`) and opening-hours strings. Conditional parsing respects bracket nesting when splitting on semicolons; edit helpers rebuild tag values from structured parts. Opening-hours parsing wraps the `opening_hours` library, adds odd/even day patterns (`1-31/2`, `2-30/2`), and exposes diagnostics plus open/closed state at a timestamp.

## Usage

```ts
import {
  parseConditionalTag,
  formatConditionalValue,
  buildConditionalTagValue,
  parseConditionalTagForEdit,
  parseOpeningHours,
  parseOpeningHoursDiagnostics,
  getOpeningHourseState,
} from '@osm-editor-kit/osm-tag-syntax'

parseConditionalTag('no @ (Mo-Fr 08:00-18:00); yes @ (Sa-Su)')
// → [{ value: 'no', condition: 'Mo-Fr 08:00-18:00' }, { value: 'yes', condition: 'Sa-Su' }]

formatConditionalValue('no', 'Mo-Fr 08:00-18:00') // → "no @ (Mo-Fr 08:00-18:00)"

parseConditionalTagForEdit('no @ (Mo-Fr); yes @ (Sa-Su)') // trailing empty row for edit UIs

parseOpeningHours('Mo-Fr 08:00-18:00') // OpeningHours instance, or 'even' | 'odd' for day patterns
parseOpeningHoursDiagnostics('invalid') // → { warnings: [], error: '…' }

getOpeningHourseState(hours, new Date()) // open/closed at timestamp
```

Depends on `opening_hours` for opening-hours parsing.
