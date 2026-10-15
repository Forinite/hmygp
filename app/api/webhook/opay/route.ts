import { NextResponse } from 'next/server'
// Not live on purpose: implement OPay's callback signature check (HMAC-SHA512 with OPAY_SECRET_KEY, per your
// merchant docs), then call creditPayment(reference, amountInNaira) exactly like the Paystack webhook does.
export async function POST() { return new NextResponse('OPay webhook not configured', { status: 501 }) }
