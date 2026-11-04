import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LumaHacks',
    short_name: 'LumaHacks',
    description: 'LumaHacks preregistration by UCF SASE',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#031525',
    icons: [
      {
        src: '/saselogo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
