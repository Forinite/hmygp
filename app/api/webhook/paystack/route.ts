import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { creditPayment } from '@/lib/payments'
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(raw).digest('hex')
  if (sig !== req.headers.get('x-paystack-signature')) return new NextResponse('bad signature', { status: 401 })
  const ev = JSON.parse(raw)
  if (ev.event === 'charge.success') await creditPayment(ev.data.reference, ev.data.amount / 100)
  return NextResponse.json({ ok: true })
}
