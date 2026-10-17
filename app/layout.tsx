import './globals.css'
import Link from 'next/link'
import { Bricolage_Grotesque } from 'next/font/google'
import { SITE } from '@/lib/seo'
import Nav from '@/components/Nav'
import SW from '@/components/SW'
const f = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f' })
const description = 'Nigeria’s task marketplace. Pay safely into escrow, get campus tasks, errands and services done, and release the money only when it is done. Split big tasks into lots with friends.'
export const metadata = { metadataBase: new URL(SITE), applicationName: 'HowMuchYouGoPay?', description, category: 'business',
  title: { default: 'HowMuchYouGoPay? · Pay safely, get tasks done', template: '%s | HowMuchYouGoPay?' },
  keywords: ['task marketplace Nigeria', 'hire someone for a task', 'escrow payment', 'campus errands', 'split payment', 'OPay', 'Paystack'],
  formatDetection: { telephone: false },
  openGraph: { type: 'website', siteName: 'HowMuchYouGoPay?', locale: 'en_NG', title: 'HowMuchYouGoPay? · Pay safely, get tasks done', description },
  twitter: { card: 'summary_large_image' as const, title: 'HowMuchYouGoPay?', description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  icons: { icon: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' }], apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'HMYGP?', statusBarStyle: 'black-translucent' as const } }
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const, themeColor: '#17123D' }
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={f.variable}>
    <header className="top"><Link href="/" className="logo">HowMuchYouGoPay<i>?</i></Link></header>
    {children}<Nav /><SW />
  </body></html>)
}
