'use client'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
import { useUser, startPay, api } from '@/lib/hooks'
import Chat from '@/components/Chat'
const LABEL: any = { funding: 'Waiting for lots to be paid', awaiting: 'Waiting for the doer to accept', open: 'Fully funded. Waiting for someone to take it', accepted: 'In progress', done: 'Done', declined: 'Declined and refunded', cancelled: 'Cancelled and refunded' }
export default function Commission() {
  const { id } = useParams<{ id: string }>(); const user = useUser()
  const [s, setS] = useState<any>(null); const [c, setC] = useState<any>(null); const [mine, setMine] = useState(0); const [n, setN] = useState(1); const [err, setErr] = useState(''); const [payMsg, setPayMsg] = useState('')
  const load = useCallback(async () => {
    const { data } = await sb.from('lot_status').select('*').eq('commission_id', id).single(); setS(data)
    const { data: p } = await sb.from('commissions').select('*').eq('id', id).maybeSingle(); setC(p)
    const { data: k } = await sb.from('contributions').select('lots').eq('commission_id', id).eq('status', 'paid'); setMine((k ?? []).reduce((a, x) => a + x.lots, 0))
  }, [id])
  useEffect(() => { load() }, [load, user])
  if (!s) return <main className="sub">Loading…</main>
  const act = async (fn: string, args: any = {}) => { setErr(''); const { error } = await sb.rpc(fn, { cid: id, ...args }); if (error) setErr(error.message); else if (['refund_my_lots', 'cancel_task'].includes(fn) || args.accept === false) await api('/api/refund', { commission_id: id }); load() }
  const collect = async () => { const r = await api('/api/payout', { commission_id: id }); setPayMsg(r.error || (r.status === 'sent' ? 'Sent to your bank.' : 'Your payment is on its way (' + r.status + ').')) }
  const pay = async (p: 'opay' | 'paystack') => { try { await startPay(id, n, p) } catch (e: any) { setErr(e.message) } }
  const left = s.total_lots - s.lots_paid, open = ['funding', 'awaiting', 'open'].includes(s.status)
  const isDoer = c?.doer === user?.id, isReq = c?.requester === user?.id, member = isDoer || isReq || mine > 0
  return (<main>
    <span className="price">{naira(s.price)}</span><h1 style={{ marginTop: 14 }}>{s.title}</h1>
    <div className="lots">{Array.from({ length: s.total_lots }, (_, i) => <span key={i} className={'lot' + (i < s.lots_paid ? ' f' : '')} />)}</div>
    <p className="sub">{s.lots_paid} of {s.total_lots} lots paid ({naira(s.lot_price)} each) · {LABEL[s.status]}</p>
    {err && <p className="err">{err}</p>}
    {user === null && <Link className="btn pri" href="/login">Sign in to take part</Link>}
    {c?.note && isDoer && s.status !== 'funding' && <div className="panel"><b>Note from the payer</b><p>{c.note}</p></div>}
    {user && open && left > 0 && !isDoer && <div className="panel"><label>Lots to pay ({naira(n * s.lot_price)})</label>
      <select value={n} onChange={e => setN(+e.target.value)}>{Array.from({ length: left }, (_, i) => i + 1).map(x => <option key={x}>{x}</option>)}</select>
      <div className="row"><button className="go" onClick={() => pay('opay')}>Pay with OPay</button><button onClick={() => pay('paystack')}>Pay with card</button></div></div>}
    {open && mine > 0 && <button className="ghost" onClick={() => act('refund_my_lots')}>Refund my {mine} lot{mine > 1 ? 's' : ''} and leave</button>}
    {s.status === 'awaiting' && isDoer && <div className="row"><button className="go" onClick={() => act('respond', { accept: true })}>Accept</button><button onClick={() => act('respond', { accept: false })}>Decline and refund</button></div>}
    {s.status === 'open' && user && !member && <button className="go" onClick={() => act('take_task')}>Take this task</button>}
    {s.status === 'accepted' && member && user && <>
      <Chat cid={id} me={user.id} />
      <p className="sub">Doer confirmed: {c?.doer_done ? 'yes' : 'no'} · Requester confirmed: {c?.requester_done ? 'yes' : 'no'}. The chat is deleted once both confirm.</p>
      {(isDoer || isReq) && <div className="row"><button className="go" onClick={() => act('confirm_done')}>Confirm it's done</button>{isDoer && <button onClick={() => act('cancel_task')}>Cancel and refund</button>}</div>}</>}
    {s.status === 'done' && isDoer && <div className="panel"><b>Your payment</b><p className="sub">{payMsg || 'Both sides confirmed. Collect your money.'}</p><button className="go" onClick={collect}>Send my payment to my bank</button></div>}
  </main>)
}
