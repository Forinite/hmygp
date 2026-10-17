import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Commission from './Client'
import { SITE, getLots, naira, clip, jsonLd } from '@/lib/seo'
export const revalidate = 30
type P = { params: { id: string } }
const indexable = (s: any) => s.kind === 'request' && ['funding', 'open'].includes(s.status) && s.lots_paid > 0
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await getLots(params.id)
  if (!s) return { title: 'Task', robots: { index: false, follow: false } }
  const group = s.total_lots > 1
  const title = group ? `Chip in: ${clip(s.title, 60)} · ${s.lots_paid}/${s.total_lots} lots paid` : `${clip(s.title, 70)} · ${naira(s.price)}`
  const description = (s.kind === 'request' ? `Someone needs this done and has put ${naira(s.price)} in escrow.` : `A commission worth ${naira(s.price)}.`)
    + (group ? ` ${s.lots_paid} of ${s.total_lots} lots are paid at ${naira(s.lot_price)} each. Pay a lot to join.` : '')
  const url = `${SITE}/c/${s.commission_id}`
  return { title, description, alternates: { canonical: url }, robots: indexable(s) ? undefined : { index: false, follow: false },
    openGraph: { title, description, url, siteName: 'HowMuchYouGoPay?', type: 'website', locale: 'en_NG' },
    twitter: { card: 'summary_large_image', title, description } }
}
export default async function Page({ params }: P) {
  const s = await getLots(params.id); if (!s) notFound()
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: s.title, url: `${SITE}/c/${s.commission_id}` }
  return (<>{indexable(s) && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />}<Commission initial={s} /></>)
}
