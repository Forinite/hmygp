'use client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { sb } from './supabase'
// undefined = loading, null = signed out
export function useUser() {
  const [u, setU] = useState<User | null | undefined>(undefined)
  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setU(data.user))
    const { data: l } = sb.auth.onAuthStateChange((_e, s) => setU(s?.user ?? null))
    return () => l.subscription.unsubscribe()
  }, [])
  return u
}
export async function startPay(commissionId: string, lots: number, provider: 'opay' | 'paystack') {
  const { data } = await sb.auth.getSession()
  const r = await fetch('/api/pay', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
    body: JSON.stringify({ commission_id: commissionId, lots, provider }) })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'Payment failed')
  window.location.href = j.url
}
