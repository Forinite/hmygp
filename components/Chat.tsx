'use client'
import { useEffect, useRef, useState } from 'react'
import { sb } from '@/lib/supabase'
export default function Chat({ cid, me }: { cid: string; me: string }) {
  const [msgs, setMsgs] = useState<any[]>([]); const [t, setT] = useState(''); const end = useRef<HTMLDivElement>(null)
  const load = () => sb.from('messages').select('id,body,sender,profiles(name)').eq('commission_id', cid).order('id').then(({ data }) => setMsgs(data ?? []))
  useEffect(() => { load(); const ch = sb.channel('m' + cid).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `commission_id=eq.${cid}` }, load).subscribe(); return () => { sb.removeChannel(ch) } }, [cid])
  useEffect(() => { end.current?.scrollIntoView() }, [msgs])
  async function send() { if (!t.trim()) return; const b = t; setT(''); await sb.from('messages').insert({ commission_id: cid, body: b }) }
  return (<div className="panel"><b>Chat</b>
    <div className="chat">{msgs.map(m => <div key={m.id} className={'msg' + (m.sender === me ? ' me' : '')}><small>{m.sender === me ? 'You' : m.profiles?.name}</small>{m.body}</div>)}<div ref={end} /></div>
    <div className="row"><input style={{ margin: 0 }} value={t} onChange={e => setT(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message" /><button style={{ flex: 'none' }} className="go" onClick={send}>Send</button></div></div>)
}
