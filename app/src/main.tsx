import 'normalize.css'
import { redirectLegacyMapHash, routerSearch } from '@osm-editor-kit/osm-map-url'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createAppQueryClient } from './lib/query-client'
import './styles/tailwind.css'
import './styles/main.scss'
import { routeTree } from './routeTree.gen'

redirectLegacyMapHash()

const basepath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

const router = createRouter({
  routeTree,
  basepath,
  trailingSlash: 'never',
  parseSearch: routerSearch.parse,
  stringifySearch: routerSearch.stringify,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const queryClient = createAppQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
