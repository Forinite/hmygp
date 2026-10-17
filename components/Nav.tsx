'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
const P = { home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', plus: 'M12 5v14M5 12h14', inbox: 'M4 4h16v12h-5l-3 3-3-3H4z', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0' }
const Ic = ({ d }: { d: string }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
export default function Nav() {
  const p = usePathname()
  const item = (href: string, label: string, d: string, cls = '') => <Link href={href} className={cls + (p === href ? ' on' : '')} aria-label={label}><Ic d={d} /><span>{label}</span></Link>
  return <nav className="bar">{item('/', 'Browse', P.home)}{item('/new', 'Post', P.plus, 'post')}{item('/inbox', 'Inbox', P.inbox)}{item('/login', 'Account', P.user)}</nav>
}
