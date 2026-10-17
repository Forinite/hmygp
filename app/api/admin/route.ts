import { NextRequest, NextResponse } from 'next/server'
import { admin, authUser } from '@/lib/payments'
export async function POST(req: NextRequest) {
  const u = await authUser(req); const db = admin()
  const { data: me } = u ? await db.from('profiles').select('is_admin').eq('id', u.id).single() : { data: null }
  if (!me?.is_admin) return NextResponse.json({ error: 'Admins only' }, { status: 403 })
  const b = await req.json()

  if (b.action === 'refunded') {
    if (b.kind === 'contribution') await db.from('contributions').update({ status: 'refunded' }).eq('id', b.id)
    else await db.from('payments').update({ status: 'refunded' }).eq('ref', b.id)
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'paid') {
    const { data: c } = await db.from('commissions').select('doer,total_lots,lot_price,status').eq('id', b.commission_id).single()
    if (!c || c.status !== 'done') return NextResponse.json({ error: 'Not a finished commission' }, { status: 400 })
    const gross = c.total_lots * c.lot_price, fee = Math.floor(gross * Number(process.env.PLATFORM_FEE_PERCENT || 0) / 100)
    await db.from('payouts').upsert({ commission_id: b.commission_id, doer: c.doer, amount: gross - fee, fee, ref: 'manual_' + crypto.randomUUID().replaceAll('-', ''), status: 'sent' })
    return NextResponse.json({ ok: true })
  }

  // action: list
  const { data: cs } = await db.from('contributions').select('id,commission_id,user_id,payment_ref').eq('status', 'refund_due')
  const refs = (cs ?? []).map(x => x.payment_ref)
  const { data: p1 } = refs.length ? await db.from('payments').select('*').in('ref', refs) : { data: [] }
  const { data: orphans } = await db.from('payments').select('*').eq('status', 'refund_due')
  const { data: po } = await db.from('payouts').select('*')
  const sentIds = new Set((po ?? []).filter(x => x.status === 'sent').map(x => x.commission_id))
  const { data: done } = await db.from('commissions').select('id,doer,total_lots,lot_price,listings(title)').eq('status', 'done')
  const todo = (done ?? []).filter(c => !sentIds.has(c.id))
  const userIds = [...(cs ?? []).map(x => x.user_id), ...(orphans ?? []).map(x => x.user_id), ...todo.map(x => x.doer)].filter(Boolean)
  const { data: names } = await db.from('profiles').select('id,name').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])
  const { data: banks } = await db.from('bank_accounts').select('*').in('user_id', todo.map(x => x.doer).filter(Boolean).length ? todo.map(x => x.doer) : ['00000000-0000-0000-0000-000000000000'])
  const nm = (id: string) => names?.find(n => n.id === id)?.name ?? 'Unknown'
  const refunds = [
    ...(cs ?? []).map(x => { const p = p1?.find(y => y.ref === x.payment_ref); return { kind: 'contribution', id: x.id, commission_id: x.commission_id, who: nm(x.user_id), amount: p?.amount, provider: p?.provider } }),
    ...(orphans ?? []).map(x => ({ kind: 'payment', id: x.ref, commission_id: x.commission_id, who: nm(x.user_id), amount: x.amount, provider: x.provider })),
  ]
  const payouts = todo.map(c => { const o = po?.find(x => x.commission_id === c.id); const bk = banks?.find(x => x.user_id === c.doer)
    return { commission_id: c.id, title: (c as any).listings?.title, who: nm(c.doer), status: o?.status ?? 'not requested', amount: o?.amount ?? c.total_lots * c.lot_price,
      bank: bk ? `${bk.account_name} · ${bk.bank_name} · ${bk.account_number}` : 'No bank account saved' } })
  return NextResponse.json({ refunds, payouts })
}
