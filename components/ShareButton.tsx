'use client'
import { useEffect, useState } from 'react'
export default function ShareButton({ title }: { title: string }) {
  const [ok, setOk] = useState(false); const [native, setNative] = useState(false)
  useEffect(() => setNative('share' in navigator), [])
  const url = () => location.origin + location.pathname
  async function copy() {
    try { await navigator.clipboard.writeText(url()) } catch { const t = document.createElement('textarea'); t.value = url(); document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove() }
    setOk(true); setTimeout(() => setOk(false), 2000)
  }
  return (<div className="row" style={{ margin: '10px 0' }}>
    <button onClick={copy} aria-live="polite">{ok ? 'Link copied ✓' : 'Copy link'}</button>
    {native && <button onClick={() => navigator.share({ title, url: url() }).catch(() => {})}>Share</button>}
  </div>)
}
