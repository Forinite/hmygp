'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
import { useUser, startPay } from '@/lib/hooks'
export default function Listing() {
  const { id } = useParams<{ id: string }>(); const user = useUser(); const r = useRouter()
  const [l, setL] = useState<any>(null); const [note, setNote] = useState(''); const [total, setTotal] = useState(1); const [mine, setMine] = useState(1); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { sb.from('feed').select('*').eq('id', id).single().then(({ data }) => setL(data)) }, [id])
  if (!l) return <main className="sub">Loading…</main>
  const lot = Math.ceil(l.price / total)
  async function pay(p: 'opay' | 'paystack' | 'monnify') {
    setBusy(true); setErr('')
    const { data: cid, error } = await sb.rpc('create_commission', { p_listing: id, p_note: note, p_lots: total })
    if (error) { setBusy(false); return setErr(error.message) }
    try { await startPay(cid, Math.min(mine, total), p) } catch (e: any) { setErr(e.message); setBusy(false); r.push(`/c/${cid}`) }
  }
  return (<main>
    <span className="price">{naira(l.price)}</span><h1 style={{ marginTop: 14 }}>{l.title}</h1><p className="sub">by {l.owner_name}</p>
    {user === null ? <Link className="btn pri" href="/login">Sign in to commission</Link> : <div className="panel">
      <label>Note to {l.owner_name} (what exactly do you need?)</label><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} />
      <div className="row"><div><label>Split into lots</label><select value={total} onChange={e => { setTotal(+e.target.value); setMine(1) }}>{[1, 2, 3, 4, 5, 10, 20].map(n => <option key={n}>{n}</option>)}</select></div>
        <div><label>Lots you pay</label><select value={mine} onChange={e => setMine(+e.target.value)}>{Array.from({ length: total }, (_, i) => i + 1).map(n => <option key={n}>{n}</option>)}</select></div></div>
      <p className="sub">{naira(lot)} per lot. You pay <b>{naira(lot * mine)}</b> now into escrow. {total > 1 && 'Share the next page so others can pay the rest.'}</p>
      {err && <p className="err">{err}</p>}
      <div className="row"><button className="go" disabled={busy} onClick={() => pay('opay')}>Pay with OPay</button><button disabled={busy} onClick={() => pay('monnify')}>Monnify</button><button disabled={busy} onClick={() => pay('paystack')}>Pay with card</button></div></div>}
  </main>)
}
