import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { creditPayment } from '@/lib/payments'
// OPay signs callbacks with HMAC-SHA3-512 over a fixed string built from the payload fields (see OPay "Callback Notification Signature").
export async function POST(req: NextRequest) {
  const ev = await req.json().catch(() => null); const p = ev?.payload
  if (!p || !ev.sha512) return new NextResponse('bad body', { status: 400 })
  const str = `{Amount:"${p.amount}",Currency:"${p.currency}",Reference:"${p.reference}",Refunded:${p.refunded ? 't' : 'f'},Status:"${p.status}",Timestamp:"${p.timestamp}",Token:"${p.token ?? ''}",TransactionID:"${p.transactionId}"}`
  const sig = crypto.createHmac('sha3-512', process.env.OPAY_SECRET_KEY!).update(str).digest('hex')
  if (sig.toLowerCase() !== String(ev.sha512).toLowerCase()) { console.error('OPay signature mismatch', str); return new NextResponse('bad signature', { status: 401 }) }
  if (p.status === 'SUCCESS' && !p.refunded) await creditPayment(p.reference, Math.round(Number(p.amount) / 100))
  return NextResponse.json({ ok: true })
}
