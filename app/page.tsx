'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
export default function Home() {
  const [tab, setTab] = useState<'offer' | 'request'>('offer')
  const [rows, setRows] = useState<any[] | null>(null)
  useEffect(() => { setRows(null); sb.from('feed').select('*').eq('kind', tab).order('created_at', { ascending: false }).then(({ data }) => setRows(data ?? [])) }, [tab])
  return (<main>
    <section className="hero"><h1>Who go do am?<br /><span className="hl">How much you go pay?</span></h1>
      <p className="sub">Pay safely, get it done, then release the money. Browse offers or post what you need.</p>
      <div className="row"><Link href="/new" className="btn go">Post a task</Link></div></section>
    <div className="tabs" role="tablist"><button role="tab" className={tab === 'offer' ? 'on' : ''} onClick={() => setTab('offer')}>I'll do it</button>
      <button role="tab" className={tab === 'request' ? 'on' : ''} onClick={() => setTab('request')}>Wanted</button></div>
    {rows === null && [0, 1, 2].map(i => <div key={i} className="card sk"><span className="price">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span /></div>)}
    {rows?.length === 0 && <div className="panel empty"><b>Nothing here yet</b><p className="sub">Be the first to post.</p></div>}
    {rows?.map(r => (
      <Link key={r.id} href={r.kind === 'offer' ? `/listing/${r.id}` : `/c/${r.commission_id}`} className="card">
        <span className="price">{naira(r.price)}</span>
        <div><b className="t">{r.title}</b>
          <div className="meta"><span className="av">{(r.owner_name || '?')[0].toUpperCase()}</span>{r.owner_name}</div>
          {r.kind === 'request' && r.total_lots > 1 && <><div className="prog"><i style={{ width: `${(r.lots_paid / r.total_lots) * 100}%` }} /></div><span className="sub">{r.lots_paid}/{r.total_lots} lots paid</span></>}
        </div>
      </Link>))}
  </main>)
}
