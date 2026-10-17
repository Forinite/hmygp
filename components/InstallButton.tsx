'use client'
import { useEffect, useState } from 'react'
export default function InstallButton() {
  const [ev, setEv] = useState<any>(null); const [ios, setIos] = useState(false); const [installed, setInstalled] = useState(false)
  useEffect(() => {
    setInstalled(matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true)
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent))
    const h = (e: any) => { e.preventDefault(); setEv(e) }
    addEventListener('beforeinstallprompt', h); return () => removeEventListener('beforeinstallprompt', h)
  }, [])
  if (installed) return null
  if (ev) return <button className="go" onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null) }}>Install the app</button>
  if (ios) return <p className="sub">To install: tap Share, then Add to Home Screen.</p>
  return null
}
