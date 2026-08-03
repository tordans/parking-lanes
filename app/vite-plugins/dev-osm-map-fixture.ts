import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createDevOsmMapFixtureHandler,
  DEV_OSM_MAP_FIXTURE_ROUTE,
} from '@osm-editor-kit/osm-coverage/dev-osm-map-fixture'
import type { Plugin } from 'vite'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturePath = path.join(appRoot, 'src/modes/parking/fixtures/dev-map-bbox.json')

export function devOsmMapFixturePlugin(): Plugin {
  return {
    name: 'dev-osm-map-fixture',
    configureServer(server) {
      const base = server.config.base.replace(/\/$/, '') || ''
      const routePrefix = `${base}/${DEV_OSM_MAP_FIXTURE_ROUTE}`
      server.middlewares.use(
        createDevOsmMapFixtureHandler({
          fixturePath,
          routePrefix,
        }),
      )
    },
  }
}
