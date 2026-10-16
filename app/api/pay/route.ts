import { NextRequest, NextResponse } from 'next/server'
import { admin, initPayment } from '@/lib/payments'
export async function POST(req: NextRequest) {
  const db = admin()
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const { commission_id, lots, provider } = await req.json()
  const n = Math.floor(Number(lots))
  const { data: s } = await db.from('lot_status').select('*').eq('commission_id', commission_id).single()
  if (!['opay', 'paystack', 'monnify'].includes(provider) || !s || !['funding', 'awaiting', 'open'].includes(s.status) || n < 1 || n > s.total_lots - s.lots_paid)
    return NextResponse.json({ error: 'Those lots are not available' }, { status: 400 })
  const amount = n * s.lot_price
  const ref = 'hmygp_' + crypto.randomUUID().replaceAll('-', '')
  await db.from('payments').insert({ ref, commission_id, user_id: user.id, lots: n, amount, provider })
  try {
    const url = await initPayment(provider, { ref, amount, email: user.email!, returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/c/${commission_id}` })
    return NextResponse.json({ url })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 502 }) }
}
