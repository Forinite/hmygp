'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { api } from '@/lib/hooks'
export default function BankForm() {
  const [banks, setBanks] = useState<any[]>([]); const [saved, setSaved] = useState<any>(null)
  const [code, setCode] = useState(''); const [num, setNum] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { fetch('/api/bank').then(r => r.json()).then(setBanks); sb.from('bank_accounts').select('*').maybeSingle().then(({ data }) => setSaved(data)) }, [])
  async function save() {
    setBusy(true); setMsg('')
    const r = await api('/api/bank', { bank_code: code, bank_name: banks.find(b => b.code === code)?.name, account_number: num })
    setBusy(false)
    if (r.error) return setMsg(r.error)
    setMsg(''); setSaved({ account_name: r.account_name, account_number: num, bank_name: banks.find(b => b.code === code)?.name })
  }
  return (<div className="panel"><b>Where should we pay you?</b>
    {saved && <p className="sub">Saved: <b>{saved.account_name}</b> · {saved.bank_name} · {saved.account_number}</p>}
    <label>Bank</label><select value={code} onChange={e => setCode(e.target.value)}><option value="">Select bank</option>{banks.map(b => <option key={b.code + b.name} value={b.code}>{b.name}</option>)}</select>
    <label>Account number</label><input inputMode="numeric" maxLength={10} value={num} onChange={e => setNum(e.target.value.replace(/\D/g, ''))} />
    {msg && <p className="err">{msg}</p>}
    <button className="go" disabled={busy || num.length !== 10 || !code} onClick={save}>{saved ? 'Change account' : 'Save account'}</button></div>)
}
