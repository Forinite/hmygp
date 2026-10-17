import { card } from '@/lib/og'
import { getOffer, ngn } from '@/lib/seo'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Offer on HowMuchYouGoPay?'
export const revalidate = 60
export default async function Image({ params }: { params: { id: string } }) {
  const l = await getOffer(params.id)
  return card({ title: l?.title ?? 'Offer', price: l ? ngn(l.price) : undefined, line: l ? `by ${l.owner_name} · Pay safely with escrow` : '' })
}
