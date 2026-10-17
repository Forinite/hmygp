import './globals.css'
import Link from 'next/link'
import { Bricolage_Grotesque } from 'next/font/google'
import Nav from '@/components/Nav'
import SW from '@/components/SW'
const f = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f' })
export const metadata = { title: 'HowMuchYouGoPay?', description: 'Get tasks done. Or get paid to do them.',
  icons: { icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' }], apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'HMYGP?', statusBarStyle: 'black-translucent' as const } }
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const, themeColor: '#17123D' }
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={f.variable}>
    <header className="top"><Link href="/" className="logo">HowMuchYouGoPay<i>?</i></Link></header>
    {children}<Nav /><SW />
  </body></html>)
}
