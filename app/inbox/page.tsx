'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
import { useUser } from '@/lib/hooks'
export default function Inbox() {
  const user = useUser(); const [n, setN] = useState<any[]>([]); const [cs, setCs] = useState<any[]>([])
  useEffect(() => { if (!user) return
    sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(30).then(({ data }) => setN(data ?? []))
    sb.from('commissions').select('id,status,price,listings(title)').order('created_at', { ascending: false }).then(({ data }) => setCs(data ?? [])) }, [user])
  if (user === null) return <main><h1>Sign in to see your inbox</h1><Link className="btn pri" href="/login">Sign in</Link></main>
  return (<main><h1>Inbox</h1>
    {n.map(x => <Link key={x.id} href={`/c/${x.commission_id}`} className="card" style={{ display: 'block' }}>{x.body}</Link>)}
    {n.length === 0 && <p className="sub">No notifications yet.</p>}
    <h2>My commissions</h2>
    {cs.map(x => <Link key={x.id} href={`/c/${x.id}`} className="card"><span className="price">{naira(x.price)}</span><span><b>{x.listings?.title}</b><br /><span className="sub">{x.status}</span></span></Link>)}
  </main>)
}
