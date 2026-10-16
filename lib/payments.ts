import { createClient } from '@supabase/supabase-js'
export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
type Opts = { ref: string; amount: number; email: string; returnUrl: string }

export async function initPayment(provider: 'paystack' | 'opay' | 'monnify', o: Opts): Promise<string> {
  if (provider === 'paystack') {
    const r = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: o.email, amount: o.amount * 100, reference: o.ref, callback_url: o.returnUrl }) })
    const j = await r.json(); if (!j.status) throw new Error(j.message); return j.data.authorization_url
  }
  if (provider === 'monnify') {
    const base = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com'
    const basic = Buffer.from(`${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`).toString('base64')
    const a = await fetch(base + '/api/v1/auth/login', { method: 'POST', headers: { Authorization: 'Basic ' + basic } }).then(r => r.json())
    if (!a.requestSuccessful) throw new Error(a.responseMessage || 'Monnify login failed')
    const j = await fetch(base + '/api/v1/merchant/transactions/init-transaction', { method: 'POST',
      headers: { Authorization: 'Bearer ' + a.responseBody.accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: o.amount, customerName: o.email.split('@')[0], customerEmail: o.email, paymentReference: o.ref,
        paymentDescription: 'HowMuchYouGoPay? commission', currencyCode: 'NGN', contractCode: process.env.MONNIFY_CONTRACT_CODE,
        redirectUrl: o.returnUrl, paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'] }) }).then(r => r.json())
    if (!j.requestSuccessful) throw new Error(j.responseMessage || 'Monnify error'); return j.responseBody.checkoutUrl
  }
  // OPay Cashier (Nigeria). Staging: testapi.opaycheckout.com. Production: liveapi.opaycheckout.com
  const base = process.env.OPAY_BASE_URL || 'https://testapi.opaycheckout.com'
  const r = await fetch(base + '/api/v1/international/cashier/create', { method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPAY_PUBLIC_KEY}`, MerchantId: process.env.OPAY_MERCHANT_ID!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ country: 'NG', reference: o.ref, amount: { total: o.amount * 100, currency: 'NGN' }, returnUrl: o.returnUrl, cancelUrl: o.returnUrl,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/opay`, expireAt: 30, userInfo: { userEmail: o.email },
      product: { name: 'HowMuchYouGoPay? commission', description: 'Escrow payment for a task' } }) })
  const j = await r.json(); if (j.code !== '00000') throw new Error('OPay: ' + (j.message || 'error')); return j.data.cashierUrl
}

// Only credit lots if the provider-confirmed amount matches what we expected.
export async function creditPayment(ref: string, paidNaira: number) {
  const db = admin()
  const { data: p } = await db.from('payments').select('amount').eq('ref', ref).single()
  if (!p || p.amount !== paidNaira) return false
  await db.rpc('record_payment', { p_ref: ref }); return true
}

export const ps = (path: string, body?: any) =>
  fetch('https://api.paystack.co' + path, { method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined }).then(r => r.json())
export async function authUser(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  const { data } = await admin().auth.getUser(token); return data.user
}
