import Link from 'next/link'
import Feed from '@/components/Feed'
import { SITE, pub, jsonLd } from '@/lib/seo'
export const revalidate = 60
export const metadata = { alternates: { canonical: '/' } }
export default async function Home() {
  const { data } = await pub().from('feed').select('*').order('created_at', { ascending: false }).limit(60)
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'HowMuchYouGoPay?', url: SITE, inLanguage: 'en-NG' },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'HowMuchYouGoPay?', url: SITE, logo: `${SITE}/icons/icon-512.png` }]
  return (<main>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
    <section className="hero"><h1>Who go do am?<br /><span className="hl">How much you go pay?</span></h1>
      <p className="sub">Pay safely into escrow, get the task done, then release the money. Browse offers or post what you need.</p>
      <div className="row"><Link href="/new" className="btn go">Post a task</Link></div></section>
    <Feed initial={data ?? []} />
  </main>)
}
