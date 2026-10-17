import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'HowMuchYouGoPay?', short_name: 'HMYGP?',
    description: 'Get tasks done safely, or get paid to do them.',
    start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
    background_color: '#F3F0FF', theme_color: '#17123D', categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Post a task', url: '/new', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Inbox', url: '/inbox', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
