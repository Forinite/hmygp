'use client'
import { useState } from 'react'
import { sb } from '@/lib/supabase'
import { useUser } from '@/lib/hooks'
import BankForm from '@/components/BankForm'
import InstallButton from '@/components/InstallButton'
export default function Login() {
  const user = useUser()
  const [mode, setMode] = useState<'in' | 'up'>('in'); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [name, setName] = useState(''); const [msg, setMsg] = useState('')
  async function go() {
    const { error } = mode === 'in' ? await sb.auth.signInWithPassword({ email, password: pw }) : await sb.auth.signUp({ email, password: pw, options: { data: { name } } })
    if (error) setMsg(error.message); else if (mode === 'up') setMsg('Check your email to confirm, then sign in.'); else location.href = '/'
  }
  if (user) return <main><h1>You're signed in</h1><p className="sub">{user.email}</p><BankForm /><div style={{ marginBottom: 12 }}><InstallButton /></div><button onClick={() => sb.auth.signOut()}>Sign out</button></main>
  return (<main><h1>{mode === 'in' ? 'Sign in' : 'Create account'}</h1>
    {mode === 'up' && <><label>Name</label><input value={name} onChange={e => setName(e.target.value)} /></>}
    <label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} />
    <label>Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} />
    {msg && <p className="err">{msg}</p>}
    <button className="go" onClick={go}>{mode === 'in' ? 'Sign in' : 'Sign up'}</button>{' '}
    <button className="ghost" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'New here? Sign up' : 'Have an account? Sign in'}</button><div style={{ marginTop: 16 }}><InstallButton /></div></main>)
}
