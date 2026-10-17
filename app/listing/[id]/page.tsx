import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Listing from './Client'
import { SITE, getOffer, naira, clip, jsonLd } from '@/lib/seo'
export const revalidate = 60
type P = { params: { id: string } }
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = await getOffer(params.id)
  if (!l) return { title: 'Offer not found', robots: { index: false } }
  const title = `${clip(l.title, 70)} · ${naira(l.price)}`
  const description = `${l.owner_name} will do this for ${naira(l.price)}. Pay into escrow, chat, and release the money only when it's done.`
  const url = `${SITE}/listing/${l.id}`
  return { title, description, alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'HowMuchYouGoPay?', type: 'website', locale: 'en_NG' },
    twitter: { card: 'summary_large_image', title, description } }
}
export default async function Page({ params }: P) {
  const l = await getOffer(params.id); if (!l) notFound()
  const url = `${SITE}/listing/${l.id}`
  const ld = { '@context': 'https://schema.org', '@type': 'Service', name: l.title, url, areaServed: 'NG', provider: { '@type': 'Person', name: l.owner_name },
    offers: { '@type': 'Offer', price: l.price, priceCurrency: 'NGN', availability: 'https://schema.org/InStock', url } }
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} /><Listing initial={l} /></>)
}
