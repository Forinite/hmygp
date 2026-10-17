'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { naira } from '@/lib/supabase'
import { api, useUser } from '@/lib/hooks'
export default function Admin() {
  const user = useUser(); const [d, setD] = useState<any>(null); const [err, setErr] = useState('')
  const load = useCallback(async () => { const r = await api('/api/admin', { action: 'list' }); if (r.error) setErr(r.error); else setD(r) }, [])
  useEffect(() => { if (user) load() }, [user, load])
  const run = async (fn: () => Promise<any>) => { const r = await fn(); if (r?.error) setErr(r.error); load() }
  if (user === null) return <main><h1>Admin</h1><Link className="btn pri" href="/login">Sign in</Link></main>
  if (err) return <main><h1>Admin</h1><p className="err">{err}</p></main>
  if (!d) return <main><p className="sub">Loading…</p></main>
  return (<main><h1>Money <span className="hl">to move</span></h1>
    <h2>Refunds to send ({d.refunds.length})</h2>
    {d.refunds.length === 0 && <p className="sub">Nothing waiting.</p>}
    {d.refunds.map((x: any) => <div key={x.id} className="panel">
      <div className="spread"><b>{x.who}</b><span className="price">{x.amount ? naira(x.amount) : '?'}</span></div>
      <p className="sub">{x.provider} · <Link href={`/c/${x.commission_id}`}><u>commission</u></Link></p>
      <div className="row">
        {x.provider === 'paystack' && <button className="go" onClick={() => run(() => api('/api/refund', { commission_id: x.commission_id }))}>Try auto-refund</button>}
        <button onClick={() => run(() => api('/api/admin', { action: 'refunded', kind: x.kind, id: x.id }))}>Mark refunded</button></div></div>)}
    <h2>Doer payouts ({d.payouts.length})</h2>
    {d.payouts.length === 0 && <p className="sub">Nothing waiting.</p>}
    {d.payouts.map((x: any) => <div key={x.commission_id} className="panel">
      <div className="spread"><b>{x.who}</b><span className="price">{naira(x.amount)}</span></div>
      <p className="sub">{x.title}</p><p>{x.bank}</p><span className="pill">{x.status}</span>
      <div className="row" style={{ marginTop: 10 }}><button className="go" onClick={() => run(() => api('/api/admin', { action: 'paid', commission_id: x.commission_id }))}>Mark paid (done by hand)</button></div></div>)}
  </main>)
}
