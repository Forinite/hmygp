'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
export default function Feed({ initial }: { initial: any[] }) {
  const [tab, setTab] = useState<'offer' | 'request'>('offer'); const [rows, setRows] = useState(initial)
  useEffect(() => { sb.from('feed').select('*').order('created_at', { ascending: false }).limit(60).then(({ data }) => data && setRows(data)) }, [])
  return (<>
    <div className="tabs" role="tablist"><button role="tab" aria-selected={tab === 'offer'} className={tab === 'offer' ? 'on' : ''} onClick={() => setTab('offer')}>I'll do it</button>
      <button role="tab" aria-selected={tab === 'request'} className={tab === 'request' ? 'on' : ''} onClick={() => setTab('request')}>Wanted</button></div>
    {(['offer', 'request'] as const).map(k => { const list = rows.filter(r => r.kind === k); return (
      <section key={k} hidden={tab !== k} aria-label={k === 'offer' ? 'Offers' : 'Wanted tasks'}>
        {list.length === 0 && <div className="panel empty"><b>Nothing here yet</b><p className="sub">Be the first to post.</p></div>}
        {list.map(r => (
          <Link key={r.id} href={k === 'offer' ? `/listing/${r.id}` : `/c/${r.commission_id}`} className="card">
            <span className="price">{naira(r.price)}</span>
            <div><b className="t">{r.title}</b>
              <div className="meta"><span className="av">{(r.owner_name || '?')[0].toUpperCase()}</span>{r.owner_name}</div>
              {k === 'request' && r.total_lots > 1 && <><div className="prog"><i style={{ width: `${(r.lots_paid / r.total_lots) * 100}%` }} /></div><span className="sub">{r.lots_paid}/{r.total_lots} lots paid</span></>}
            </div>
          </Link>))}
      </section>) })}
  </>)
}
