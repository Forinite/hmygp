import './globals.css'
import Link from 'next/link'
import { Bricolage_Grotesque } from 'next/font/google'
import Nav from '@/components/Nav'
const f = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f' })
export const metadata = { title: 'HowMuchYouGoPay?', description: 'Get tasks done. Or get paid to do them.' }
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#17123D' }
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={f.variable}>
    <header className="top"><Link href="/" className="logo">HowMuchYouGoPay<i>?</i></Link></header>
    {children}<Nav />
  </body></html>)
}
