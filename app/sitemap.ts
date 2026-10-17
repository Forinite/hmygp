import type { MetadataRoute } from 'next'
import { SITE, pub } from '@/lib/seo'
export const revalidate = 3600
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await pub().from('feed').select('id,kind,commission_id,created_at').order('created_at', { ascending: false }).limit(5000)
  return [{ url: SITE, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    ...(data ?? []).map(r => ({ url: r.kind === 'offer' ? `${SITE}/listing/${r.id}` : `${SITE}/c/${r.commission_id}`, lastModified: new Date(r.created_at), changeFrequency: 'daily' as const, priority: 0.7 }))]
}
