import 'normalize.css'
import { redirectLegacyMapHash } from '@osm-editor-kit/osm-map-url'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { createAppQueryClient } from './lib/query-client'
import { routeTree } from './routeTree.gen'
import { appRouterSearch } from './shell/map/app-router-search'
import './styles/tailwind.css'
import './styles/main.scss'
redirectLegacyMapHash()

const basepath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const router = createRouter({
  routeTree,
  basepath,
  trailingSlash: 'never',
  parseSearch: appRouterSearch.parse,
  stringifySearch: appRouterSearch.stringify,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = createAppQueryClient()

async function start() {
  if (import.meta.env.DEV === true) {
    const { seedDevOsmFixture } = await import('./shell/map/dev-osm-fixture-seed')
    await seedDevOsmFixture(queryClient)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void start()
