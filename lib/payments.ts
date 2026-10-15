import { createClient } from '@supabase/supabase-js'
export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Opts = { ref: string; amount: number; email: string; returnUrl: string }

export async function initPayment(provider: 'paystack' | 'opay', o: Opts): Promise<string> {
  if (provider === 'paystack') {
    const r = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: o.email, amount: o.amount * 100, reference: o.ref, callback_url: o.returnUrl }) })
    const j = await r.json(); if (!j.status) throw new Error(j.message); return j.data.authorization_url
  }
  // OPay Cashier. Confirm field names against your OPay merchant docs before going live.
  const r = await fetch('https://liveapi.opaycheckout.com/api/v1/international/cashier/create', { method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPAY_PUBLIC_KEY}`, MerchantId: process.env.OPAY_MERCHANT_ID!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ country: 'NG', reference: o.ref, amount: { total: o.amount * 100, currency: 'NGN' }, returnUrl: o.returnUrl,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/opay`, expireAt: 30, userInfo: { userEmail: o.email },
      product: { name: 'HowMuchYouGoPay? commission', description: 'Escrow payment' } }) })
  const j = await r.json(); if (j.code !== '00000') throw new Error(j.message || 'OPay error'); return j.data.cashierUrl
}

// Only credit lots if the provider-confirmed amount matches what we expected.
export async function creditPayment(ref: string, paidNaira: number) {
  const db = admin()
  const { data: p } = await db.from('payments').select('amount').eq('ref', ref).single()
  if (!p || p.amount !== paidNaira) return false
  await db.rpc('record_payment', { p_ref: ref }); return true
}
