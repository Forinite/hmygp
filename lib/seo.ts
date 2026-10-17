import { createClient } from '@supabase/supabase-js'
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://howmuchyougopay.vercel.app').replace(/\/$/, '')
export const pub = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
export const naira = (n: number) => '₦' + Number(n).toLocaleString('en-NG')
export const ngn = (n: number) => 'NGN ' + Number(n).toLocaleString('en-NG')   // safe for generated images
export const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
export const jsonLd = (o: object) => ({ __html: JSON.stringify(o).replace(/</g, '\\u003c') })
export async function getOffer(id: string) { const { data } = await pub().from('feed').select('*').eq('id', id).eq('kind', 'offer').maybeSingle(); return data }
export async function getLots(id: string) { const { data } = await pub().from('lot_status').select('*').eq('commission_id', id).maybeSingle(); return data }
