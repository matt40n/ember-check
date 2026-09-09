import { useQuery } from '@tanstack/react-query'
import { chunkOf, type RecSite, type SiteDetail } from '../lib/mergeSites'

const base = () => import.meta.env.BASE_URL.replace(/\/$/, '')

/** Descriptions, fees, seasons etc. live in 24 detail chunks fetched when a card opens (they're 70% of the campground payload). */
export function useSiteDetail(site: RecSite | null | undefined) {
  const chunk = site ? chunkOf(site.idx) : -1
  const q = useQuery({
    queryKey: ['site-detail', chunk],
    enabled: chunk >= 0 && !!site && site.description === undefined, // the in-browser fallback path already carries detail
    staleTime: 24 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    queryFn: async () => (await fetch(`${base()}/data/sites-detail-${chunk}.json`)).json() as Promise<Record<number, SiteDetail>>,
  })
  if (!site) return { detail: null as SiteDetail | null, loading: false }
  if (site.description !== undefined) return { detail: site as SiteDetail, loading: false }
  return { detail: q.data?.[site.idx] ?? null, loading: q.isLoading }
}
