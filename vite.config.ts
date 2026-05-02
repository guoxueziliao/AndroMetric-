import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const manualChunks = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  if (id.includes('/react/') || id.includes('/react-dom/')) {
    return 'react-vendor';
  }

  if (id.includes('/dexie/') || id.includes('/dexie-react-hooks/')) {
    return 'dexie-vendor';
  }

  if (id.includes('/chart.js/') || id.includes('/react-chartjs-2/')) {
    return 'chart-vendor';
  }

  if (id.includes('/framer-motion/')) {
    return 'motion-vendor';
  }

  if (id.includes('/lucide-react/')) {
    return 'icon-vendor';
  }

  if (id.includes('/marked/')) {
    return 'markdown-vendor';
  }

  return 'vendor';
};

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: true, // Enable PWA in dev mode for testing
        type: 'module',
      },
      manifest: {
        short_name: "硬度日记",
        name: "硬度日记",
        description: "一款私密、专业的日记应用，帮助您记录每日硬度，探索生活方式与身体活力之间的联系。",
        icons: [
          {
            "src": "/icon-192.png",
            "type": "image/png",
            "sizes": "192x192",
            "purpose": "any maskable"
          },
          {
            "src": "/icon-512.png",
            "type": "image/png",
            "sizes": "512x512",
            "purpose": "any maskable"
          }
        ],
        start_url: ".",
        display: "standalone",
        background_color: "#020617",
        theme_color: "#020617"
      },
      workbox: {
        // Cache external CDNs used in index.html
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwindcss-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/aistudiocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'aistudiocdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
});
