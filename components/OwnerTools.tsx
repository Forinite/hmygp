'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb, naira } from '@/lib/supabase'
type L = { id: string; kind: string; title: string; price: number; lots?: number }
export default function OwnerTools({ listing, onSaved }: { listing: L; onSaved: () => void }) {
  const r = useRouter(); const [locked, setLocked] = useState<boolean | null>(null); const [edit, setEdit] = useState(false)
  const [title, setTitle] = useState(listing.title); const [price, setPrice] = useState(String(listing.price)); const [lots, setLots] = useState(listing.lots ?? 1)
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const what = listing.kind === 'offer' ? 'offer' : 'task'
  useEffect(() => { sb.rpc('listing_locked', { lid: listing.id }).then(({ data }) => setLocked(!!data)) }, [listing.id, listing.title, listing.price])
  if (locked === null) return null
  if (locked) return <div className="panel"><b>Your {what}</b><p className="sub">Someone has bought lots (or is paying right now), so you can't edit or delete it.</p></div>
  async function save() {
    setBusy(true); setErr('')
    const { error } = await sb.rpc('edit_listing', { p_id: listing.id, p_title: title, p_price: Number(price), p_lots: listing.kind === 'request' ? lots : null })
    setBusy(false); if (error) return setErr(error.message); setEdit(false); onSaved()
  }
  async function del() {
    if (!confirm(`Delete this ${what}? This cannot be undone.`)) return
    const { error } = await sb.rpc('delete_listing', { p_id: listing.id }); if (error) return setErr(error.message); r.push('/')
  }
  return (<div className="panel"><b>Your {what}</b>
    {!edit ? <div className="row" style={{ marginTop: 10 }}><button onClick={() => setEdit(true)}>Edit</button><button className="ghost" onClick={del}>Delete</button></div> : <>
      <label>{listing.kind === 'offer' ? 'What will you do?' : 'What do you want done?'}</label>
      <textarea rows={3} value={title} onChange={e => setTitle(e.target.value)} />
      <label>Price (₦)</label><input inputMode="numeric" value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} />
      {listing.kind === 'request' && <><label>Lots</label><select value={lots} onChange={e => setLots(+e.target.value)}>{[1, 2, 3, 4, 5, 10, 20].map(n => <option key={n} value={n}>{n}{+price ? ` · ${naira(Math.ceil(+price / n))} each` : ''}</option>)}</select></>}
      {err && <p className="err">{err}</p>}
      <div className="row"><button className="go" disabled={busy || title.length < 5 || +price < 100} onClick={save}>Save changes</button><button className="ghost" onClick={() => { setEdit(false); setErr('') }}>Cancel</button></div></>}
    {!edit && err && <p className="err">{err}</p>}</div>)
}
