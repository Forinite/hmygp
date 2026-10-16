import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { creditPayment } from '@/lib/payments'
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = crypto.createHmac('sha512', process.env.MONNIFY_SECRET_KEY!).update(raw).digest('hex')
  if (sig !== req.headers.get('monnify-signature')) return new NextResponse('bad signature', { status: 401 })
  const ev = JSON.parse(raw)
  if (ev.eventType === 'SUCCESSFUL_TRANSACTION' && ev.eventData?.paymentStatus === 'PAID')
    await creditPayment(ev.eventData.paymentReference, Math.round(Number(ev.eventData.amountPaid)))
  return NextResponse.json({ ok: true })
}
