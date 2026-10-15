import { createBrowserClient } from '@supabase/ssr'
export const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export const naira = (n: number) => '₦' + Number(n).toLocaleString('en-NG')
