import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { creditPayment, admin } from '@/lib/payments'
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(raw).digest('hex')
  if (sig !== req.headers.get('x-paystack-signature')) return new NextResponse('bad signature', { status: 401 })
  const ev = JSON.parse(raw)
  if (ev.event === 'charge.success') await creditPayment(ev.data.reference, ev.data.amount / 100)
  if (ev.event === 'transfer.success') await admin().from('payouts').update({ status: 'sent' }).eq('ref', ev.data.reference)
  if (['transfer.failed', 'transfer.reversed'].includes(ev.event)) await admin().from('payouts').update({ status: 'failed' }).eq('ref', ev.data.reference)
  return NextResponse.json({ ok: true })
}
