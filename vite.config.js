import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxies avoid browser CORS for the AI + keyed food sources.
// Client calls /api/<name>/* -> proxied to the upstream API.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // bind IPv4 + IPv6 (avoids localhost/::1 mismatch)
    strictPort: true,
    proxy: {
      '/api/zen': {
        target: 'https://opencode.ai/zen',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/zen/, ''),
      },
      '/api/off': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        headers: { 'User-Agent': 'Nutrifix/1.0 (https://nutrifix.app)' },
        rewrite: (p) => p.replace(/^\/api\/off/, ''),
      },
      '/api/edamam': {
        target: 'https://api.edamam.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/edamam/, ''),
      },
      '/api/nutritionix': {
        target: 'https://trackapi.nutritionix.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/nutritionix/, ''),
      },
    },
  },
})
