'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
export default function Home() {
  const [tab, setTab] = useState<'offer' | 'request'>('offer')
  const [rows, setRows] = useState<any[] | null>(null)
  useEffect(() => { setRows(null); sb.from('feed').select('*').eq('kind', tab).order('created_at', { ascending: false }).then(({ data }) => setRows(data ?? [])) }, [tab])
  return (<main>
    <h1>How much you go pay?</h1>
    <div className="tabs"><button className={tab === 'offer' ? 'on' : ''} onClick={() => setTab('offer')}>I'll do it</button>
      <button className={tab === 'request' ? 'on' : ''} onClick={() => setTab('request')}>Wanted</button></div>
    {rows === null && <p className="sub">Loading…</p>}
    {rows?.length === 0 && <p className="sub">Nothing here yet. Be the first to post.</p>}
    {rows?.map(r => (
      <Link key={r.id} href={r.kind === 'offer' ? `/listing/${r.id}` : `/c/${r.commission_id}`} className="card">
        <span className="price">{naira(r.price)}</span>
        <span><b>{r.title}</b><br /><span className="sub">{r.owner_name}{r.kind === 'request' && r.total_lots > 1 ? ` · ${r.lots_paid}/${r.total_lots} lots paid` : ''}</span></span>
      </Link>))}
  </main>)
}
