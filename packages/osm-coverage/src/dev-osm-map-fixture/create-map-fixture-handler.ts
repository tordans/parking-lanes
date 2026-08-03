import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'
import { filterElementsByBbox } from './filter-elements-by-bbox'
import { loadOsmMapFixtureIndex } from './fixture-index'
import type { MapBbox } from './types'

export type CreateDevOsmMapFixtureHandlerOptions = {
  fixturePath: string
  routePrefix: string
}

function parseBboxParam(value: string | null): MapBbox | null {
  if (!value) return null
  const parts = value.split(',').map((part) => Number(part.trim()))
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null
  const [west, south, east, north] = parts
  return { west, south, east, north }
}

/** Connect-style middleware serving OSM Map API–shaped bbox slices from a local fixture file. */
export function createDevOsmMapFixtureHandler({
  fixturePath,
  routePrefix,
}: CreateDevOsmMapFixtureHandlerOptions) {
  const mapPath = `${routePrefix.replace(/\/$/, '')}/api/0.6/map`
  let missingFile = false

  return function devOsmMapFixtureHandler(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): void {
    if (req.method !== 'GET' || !req.url) {
      next()
      return
    }

    const url = new URL(req.url, 'http://localhost')
    if (url.pathname !== mapPath) {
      next()
      return
    }

    const bbox = parseBboxParam(url.searchParams.get('bbox'))
    if (!bbox) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Invalid bbox parameter')
      return
    }

    if (missingFile || !existsSync(fixturePath)) {
      missingFile = true
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error:
            'Dev OSM fixture missing. Run `bun run dev` (predev) to download app/src/modes/parking/fixtures/dev-map-bbox.json.',
        }),
      )
      return
    }

    const index = loadOsmMapFixtureIndex(fixturePath)
    const elements = filterElementsByBbox(index, bbox)

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ elements }))
  }
}
