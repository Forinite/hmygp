import { NextRequest, NextResponse } from 'next/server'
import { admin, ps, authUser } from '@/lib/payments'
export async function GET() {
  const j = await ps('/bank?country=nigeria&currency=NGN&perPage=200')
  return NextResponse.json((j.data ?? []).map((b: any) => ({ name: b.name, code: b.code })))
}
export async function POST(req: NextRequest) {
  const user = await authUser(req); if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  const { bank_code, bank_name, account_number } = await req.json()
  if (!/^\d{10}$/.test(account_number) || !bank_code) return NextResponse.json({ error: 'Enter a 10-digit account number and pick a bank' }, { status: 400 })
  const r = await ps(`/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`)
  if (!r.status) return NextResponse.json({ error: r.message || 'Could not verify that account' }, { status: 400 })
  const rec = await ps('/transferrecipient', { type: 'nuban', name: r.data.account_name, account_number, bank_code, currency: 'NGN' })
  if (!rec.status) return NextResponse.json({ error: rec.message }, { status: 502 })
  await admin().from('bank_accounts').upsert({ user_id: user.id, bank_code, bank_name, account_number, account_name: r.data.account_name, recipient_code: rec.data.recipient_code })
  return NextResponse.json({ account_name: r.data.account_name })
}
