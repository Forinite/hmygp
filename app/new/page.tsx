'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sb, naira } from '@/lib/supabase'
import { useUser } from '@/lib/hooks'
export default function New() {
  const user = useUser(); const r = useRouter()
  const [kind, setKind] = useState<'offer' | 'request'>('offer'); const [title, setTitle] = useState(''); const [price, setPrice] = useState(''); const [lots, setLots] = useState(1); const [err, setErr] = useState('')
  if (user === null) return <main><h1>Sign in to post</h1><Link className="btn pri" href="/login">Sign in</Link></main>
  async function post() {
    const { data, error } = await sb.rpc('create_listing', { p_kind: kind, p_title: title, p_price: Number(price), p_lots: lots })
    if (error) return setErr(error.message)
    r.push(kind === 'request' ? `/c/${data.commission_id}` : `/listing/${data.listing_id}`)
  }
  return (<main><h1>Post</h1>
    <div className="tabs"><button className={kind === 'offer' ? 'on' : ''} onClick={() => setKind('offer')}>I'll do something</button>
      <button className={kind === 'request' ? 'on' : ''} onClick={() => setKind('request')}>I want something done</button></div>
    <label>{kind === 'offer' ? 'What will you do?' : 'What do you want done?'}</label>
    <textarea rows={3} value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'offer' ? 'I will snap the result for CPE 200 level and send it to you' : 'I want someone to snap the result for CPE 200 and send it to the CPE 300 group'} />
    <label>Price (₦)</label><input inputMode="numeric" value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} />
    {kind === 'request' && <><label>Split into how many lots? (others can pay a lot each)</label>
      <select value={lots} onChange={e => setLots(+e.target.value)}>{[1, 2, 3, 4, 5, 10, 20].map(n => <option key={n} value={n}>{n}{price ? ` · ${naira(Math.ceil(+price / n))} each` : ''}</option>)}</select></>}
    {err && <p className="err">{err}</p>}
    <button className="go" onClick={post} disabled={!title || +price < 100}>{kind === 'offer' ? 'Post offer' : 'Post and pay your lot'}</button></main>)
}
