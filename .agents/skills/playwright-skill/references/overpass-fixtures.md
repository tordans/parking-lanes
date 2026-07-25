# Overpass fixtures for E2E

**Rule:** Default E2E and CI must **never** call live Overpass interpreters. Serve committed JSON fixtures via `page.route()`.

Applies to **street-space-editor** (`overpass-api.de`, `maps.mail.ru/osm/tools/overpass`) and any OSM viewer that loads bbox data through Overpass.

---

## Opt-in live runs only

| Env var                   | Meaning                                      |
| ------------------------- | -------------------------------------------- |
| *(unset)*                 | Fixtures only — **required** for CI          |
| `RUN_LIVE_OVERPASS_E2E=1` | Allow live Overpass (local manual debugging) |

Never set `RUN_LIVE_OVERPASS_E2E` in CI.

---

## Layout

```
tests/
  fixtures/
    overpass.ts              # installOverpassFixtures, blockLiveOverpass
    overpass/
      default-viewer-bbox.json   # small bbox, viewer query shape
      editor-bbox.json           # optional: editor / OSM map endpoint shape
  utils/
    overpass-guard.ts        # optional: shared host list + assertNoLiveOverpass
```

Fixture files are **raw Overpass `[out:json]` responses** (same shape `downloadContent` / `parseOsmResp` expects in `src/utils/data-client.ts`).

---

## Capture a fixture (one-time, outside CI)

Use a **small bbox** (single intersection or short street). street-space-editor default map from README: `#16/52.4751/13.4435`.

1. Build the same URL the app would use — see `src/parking/data-url.ts` (`getOverpassViewerQuery`).
2. Fetch once locally:

```bash
mkdir -p tests/fixtures/overpass
curl -fsSL -o tests/fixtures/overpass/default-viewer-bbox.json \
  'https://overpass-api.de/api/interpreter?data=[out:json];(...your query...)'
```

3. Commit the JSON. Re-capture only when query shape or required tags change.

**Do not** add a Playwright test that downloads fixtures from Overpass.

---

## `tests/fixtures/overpass.ts`

```typescript
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page, Route } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(__dirname, 'overpass')

/** Public Overpass interpreters — must not be hit in default E2E. */
export const LIVE_OVERPASS_URL_RE =
  /\/(?:api\/interpreter|osm\/tools\/overpass\/api\/interpreter)(?:\?|$)/

export function liveOverpassE2EEnabled(): boolean {
  return process.env.RUN_LIVE_OVERPASS_E2E === '1'
}

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf8')
}

/** Abort live Overpass if a test forgot to mock. Call before navigation. */
export async function blockLiveOverpass(page: Page): Promise<void> {
  if (liveOverpassE2EEnabled()) return

  await page.route(LIVE_OVERPASS_URL_RE, (route: Route) =>
    route.abort('blockedbyclient'),
  )
}

/** Fulfill Overpass interpreter requests with a committed fixture. */
export async function installOverpassFixtures(
  page: Page,
  fixtureName = 'default-viewer-bbox',
): Promise<void> {
  if (liveOverpassE2EEnabled()) return

  const body = loadFixture(fixtureName)

  await page.route(LIVE_OVERPASS_URL_RE, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    })
  })
}
```

Register **`installOverpassFixtures` after `blockLiveOverpass`** is unnecessary — only use `installOverpassFixtures` (fulfill) **or** register fulfill first so it takes precedence. Typical pattern: **only** `installOverpassFixtures` in `beforeEach`; add `blockLiveOverpass` in a shared fixture when some specs intentionally omit data mocks.

---

## Playwright base fixture (recommended)

```typescript
// tests/fixtures/base.ts
import { test as base } from '@playwright/test'
import { installOverpassFixtures, liveOverpassE2EEnabled } from './overpass'

export const test = base.extend({
  page: async ({ page }, use) => {
    if (!liveOverpassE2EEnabled()) {
      await installOverpassFixtures(page)
    }
    await use(page)
  },
})

export { expect } from '@playwright/test'
```

Import `test` / `expect` from `./fixtures/base` in map specs — not from `@playwright/test` directly.

---

## Spec example

```typescript
import { test, expect } from './fixtures/base'
import { waitForMapLoad } from '../utils/maps'

test('loads parking lanes from fixture', async ({ page }) => {
  await page.goto('/#16/52.4751/13.4435')
  await waitForMapLoad(page)
  await expect(page.getByRole('main')).toBeVisible()
})
```

---

## OSM API map endpoint (editor mode)

Editor / dev-server paths use `…/api/0.6/map?bbox=` (`src/parking/data-url.ts`), not Overpass. Mock separately:

```typescript
await page.route('**/api/0.6/map**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/xml',
    path: 'tests/fixtures/osm/map-bbox.xml',
  })
})
```

Keep editor and viewer fixtures separate.

---

## Agent-browser / ad-hoc scripts

Same rule: do **not** drive the app against live Overpass in automated exploration. Use fixture injection via dev-server proxy, local mock server, or pre-seeded `localStorage` / in-app test hook — not repeated live bbox downloads.

---

## Checklist

- [ ] `tests/fixtures/overpass/*.json` committed (small bbox)
- [ ] `installOverpassFixtures` wired through base fixture or `beforeEach`
- [ ] CI does **not** set `RUN_LIVE_OVERPASS_E2E`
- [ ] `tests/README.md` documents fixture capture and env var
- [ ] No spec calls `overpass-api.de` or Mail.ru interpreter URLs directly
