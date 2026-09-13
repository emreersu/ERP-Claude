import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'BayTech Mühendislik - Satın Alma Yönetim Sistemi',
        short_name: 'BayTech Satın Alma',
        description: 'BayTech Mühendislik satın alma ve tedarik yönetim sistemi',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a1730',
        theme_color: '#0a1730',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
