import Link from 'next/link'
import Feed from '@/components/Feed'
import { SITE, pub, jsonLd } from '@/lib/seo'
export const revalidate = 60
export const metadata = { alternates: { canonical: '/' },
  openGraph: { url: '/', type: 'website' as const, siteName: 'HowMuchYouGoPay?', locale: 'en_NG', title: 'HowMuchYouGoPay? · Pay safely, get tasks done',
    description: 'Nigeria’s task marketplace. Pay safely into escrow, get campus tasks, errands and services done, and release the money only when it is done. Split big tasks into lots with friends.' } }
export default async function Home() {
  const { data } = await pub().from('feed').select('*').order('created_at', { ascending: false }).limit(60)
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'HowMuchYouGoPay?', url: SITE, inLanguage: 'en-NG' },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'HowMuchYouGoPay?', url: SITE, logo: `${SITE}/icons/icon-512.png` }]
  return (<main>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    <section className="hero"><h1><span className="hl">How much you go pay?</span></h1>
      <p className="sub">Pay safely into escrow, get the task done, then release the money. Browse offers or post what you need.</p>
      <div className="row"><Link href="/new" className="btn go">Post a task</Link></div></section>
    <Feed initial={data ?? []} />
  </main>)
}
