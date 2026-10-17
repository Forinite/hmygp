'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
import { useUser } from '@/lib/hooks'
export default function Inbox() {
  const user = useUser(); const [n, setN] = useState<any[]>([]); const [cs, setCs] = useState<any[]>([]); const [mine, setMine] = useState<any[]>([])
  useEffect(() => { if (!user) return
    sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(30).then(({ data }) => setN(data ?? []))
    Promise.all([sb.from('listings').select('id,title,price').eq('owner', user.id).eq('kind', 'offer').order('created_at', { ascending: false }),
      sb.from('lot_status').select('commission_id,title,price').eq('requester', user.id).eq('kind', 'request').not('status', 'in', '(done,declined,cancelled)')])
      .then(([a, b]) => setMine([...(a.data ?? []).map(x => ({ href: `/listing/${x.id}`, title: x.title, price: x.price, tag: 'Offer' })), ...(b.data ?? []).map(x => ({ href: `/c/${x.commission_id}`, title: x.title, price: x.price, tag: 'Wanted' }))]))
    sb.from('commissions').select('id,status,price,listings(title)').order('created_at', { ascending: false }).then(({ data }) => setCs(data ?? [])) }, [user])
  if (user === null) return <main><h1>Sign in to see your inbox</h1><Link className="btn pri" href="/login">Sign in</Link></main>
  return (<main><h1>Inbox</h1>
    {n.map(x => <Link key={x.id} href={`/c/${x.commission_id}`} className="card" style={{ display: 'block' }}>{x.body}</Link>)}
    {n.length === 0 && <p className="sub">No notifications yet.</p>}
    <h2>My posts</h2>
    {mine.length === 0 && <p className="sub">You haven't posted anything yet.</p>}
    {mine.map(x => <Link key={x.href} href={x.href} className="card"><span className="price">{naira(x.price)}</span><span><b>{x.title}</b><br /><span className="sub">{x.tag}</span></span></Link>)}
    <h2>My commissions</h2>
    {cs.map(x => <Link key={x.id} href={`/c/${x.id}`} className="card"><span className="price">{naira(x.price)}</span><span><b>{x.listings?.title}</b><br /><span className="sub">{x.status}</span></span></Link>)}
  </main>)
}
