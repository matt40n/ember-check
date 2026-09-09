import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
import './index.css'
import App from './App.tsx'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 24 * 60 * 60_000, gcTime: 24 * 60 * 60_000, refetchOnWindowFocus: false, retry: 1 } } })
// Boundaries and the campground index (~500 KB gzipped) persist in IndexedDB so a repeat visit paints pins with no
// network; the cache is keyed to the build so every deploy starts clean. Live feeds (RFW, fires) are hourly-stale anyway.
const persister = createAsyncStoragePersister({ storage: { getItem: (k) => get(k), setItem: (k, v) => set(k, v), removeItem: (k) => del(k) }, key: 'ember-check-query-cache' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={qc} persistOptions={{ persister, maxAge: 24 * 60 * 60_000, buster: __BUILD_ID__ }}>
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)
