import { card } from '@/lib/og'
import { getLots, ngn } from '@/lib/seo'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Task on HowMuchYouGoPay?'
export const revalidate = 30
export default async function Image({ params }: { params: { id: string } }) {
  const s = await getLots(params.id)
  const line = !s ? '' : s.total_lots > 1 ? `${s.lots_paid} of ${s.total_lots} lots paid · ${ngn(s.lot_price)} each` : 'Funded through escrow'
  return card({ title: s?.title ?? 'Task', price: s ? ngn(s.price) : undefined, line })
}
