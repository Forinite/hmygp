import { NextRequest, NextResponse } from 'next/server'
import { admin, ps, authUser } from '@/lib/payments'
// Refunds every payment on this commission that is marked refund_due, back to the original payer. Idempotent.
export async function POST(req: NextRequest) {
  if (!(await authUser(req))) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const db = admin(); const { commission_id: cid } = await req.json(); let done = 0, failed = 0
  const { data: cs } = await db.from('contributions').select('id,payment_ref').eq('commission_id', cid).eq('status', 'refund_due')
  for (const x of cs ?? []) {
    const { data: pay } = await db.from('payments').select('provider').eq('ref', x.payment_ref).single()
    if (pay?.provider !== 'paystack') { failed++; continue } // Monnify/OPay refunds are manual for now
    const r = await ps('/refund', { transaction: x.payment_ref })
    if (r.status) { await db.from('contributions').update({ status: 'refunded' }).eq('id', x.id); done++ } else failed++
  }
  const { data: ps2 } = await db.from('payments').select('ref,provider').eq('commission_id', cid).eq('status', 'refund_due')
  for (const x of ps2 ?? []) {
    if (x.provider !== 'paystack') { failed++; continue }
    const r = await ps('/refund', { transaction: x.ref })
    if (r.status) { await db.from('payments').update({ status: 'refunded' }).eq('ref', x.ref); done++ } else failed++
  }
  return NextResponse.json({ refunded: done, failed })
}
