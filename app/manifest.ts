import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SASE UCF Portal',
    short_name: 'SASE UCF',
    description: 'Society of Asian Scientists and Engineers UCF Chapter Portal',
    start_url: '/checkin',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
