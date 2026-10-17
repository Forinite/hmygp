import { ImageResponse } from 'next/og'
// 1200x630 share card in the app's look: navy, lime price tag, coral dot.
export function card({ title, price, line }: { title: string; price?: string; line?: string }) {
  return new ImageResponse(
    (<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', background: '#17123D', padding: 64, color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, fontWeight: 800 }}>HowMuchYouGoPay
        <div style={{ display: 'flex', marginLeft: 10, width: 52, height: 52, borderRadius: 26, background: '#FF6A3D', color: '#17123D', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>?</div></div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {price && <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#C8F53C', color: '#17123D', fontSize: 84, fontWeight: 800, padding: '8px 32px', borderRadius: 20, marginBottom: 36, transform: 'rotate(-2deg)', boxShadow: '8px 8px 0 #FF6A3D' }}>{price}</div>}
        <div style={{ display: 'flex', fontSize: title.length > 80 ? 50 : 64, fontWeight: 800, lineHeight: 1.1 }}>{title.length > 140 ? title.slice(0, 139) + '…' : title}</div>
      </div>
      <div style={{ display: 'flex', fontSize: 32, color: '#B9B3E8' }}>{line}</div>
    </div>), { width: 1200, height: 630 })
}
