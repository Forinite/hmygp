import { NextRequest, NextResponse } from 'next/server'
import { admin, ps, authUser } from '@/lib/payments'
// Doer asks for their money after both sides confirmed. Safe to call repeatedly.
export async function POST(req: NextRequest) {
  const user = await authUser(req); if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const db = admin(); const { commission_id: cid } = await req.json()
  const { data: c } = await db.from('commissions').select('status,doer,total_lots,lot_price').eq('id', cid).single()
  if (!c || c.status !== 'done' || c.doer !== user.id) return NextResponse.json({ error: 'Not ready for payout' }, { status: 400 })
  const { data: bank } = await db.from('bank_accounts').select('recipient_code').eq('user_id', user.id).maybeSingle()
  if (!bank) return NextResponse.json({ error: 'Add your bank account on the Account page first' }, { status: 400 })
  let { data: p } = await db.from('payouts').select('*').eq('commission_id', cid).maybeSingle()
  if (p?.status === 'sent') return NextResponse.json({ status: 'sent' })
  if (p?.status === 'pending') return NextResponse.json({ status: 'pending' })
  if (p?.status === 'failed') { // retry with a fresh reference
    p.ref = 'payout_' + crypto.randomUUID().replaceAll('-', '')
    await db.from('payouts').update({ ref: p.ref, status: 'pending' }).eq('commission_id', cid)
  } else {
    const gross = c.total_lots * c.lot_price, fee = Math.floor(gross * Number(process.env.PLATFORM_FEE_PERCENT || 0) / 100)
    const row = { commission_id: cid, doer: user.id, amount: gross - fee, fee, ref: 'payout_' + crypto.randomUUID().replaceAll('-', '') }
    const { error } = await db.from('payouts').insert(row)
    if (error) return NextResponse.json({ status: 'pending' }) // another request got there first
    p = row as any
  }
  const t = await ps('/transfer', { source: 'balance', amount: p!.amount * 100, recipient: bank.recipient_code, reason: 'HowMuchYouGoPay? payout', reference: p!.ref })
  if (!t.status) { await db.from('payouts').update({ status: 'failed' }).eq('commission_id', cid); return NextResponse.json({ error: t.message }, { status: 502 }) }
  if (t.data.status === 'success') await db.from('payouts').update({ status: 'sent' }).eq('commission_id', cid)
  if (t.data.status === 'otp') return NextResponse.json({ error: 'Transfer needs OTP approval. Turn that off in Paystack settings.' }, { status: 409 })
  return NextResponse.json({ status: t.data.status })
}
