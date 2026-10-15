import './globals.css'
import Link from 'next/link'
import { Bricolage_Grotesque } from 'next/font/google'
const f = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f' })
export const metadata = { title: 'HowMuchYouGoPay?', description: 'Get tasks done. Or get paid to do them.' }
export const viewport = { width: 'device-width', initialScale: 1 }
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className={f.variable}>{children}
    <nav className="bar"><Link href="/">Browse</Link><Link href="/new" className="post">Post</Link><Link href="/inbox">Inbox</Link><Link href="/login">Account</Link></nav>
  </body></html>)
}
