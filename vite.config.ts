import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy API requests to backend server in development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Legacy proxy for dineoncampus (no longer used, but keeping for reference)
      '/api/dineoncampus': {
        target: 'https://dineoncampus.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dineoncampus/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
            proxyReq.setHeader('Connection', 'keep-alive');
            proxyReq.setHeader('Upgrade-Insecure-Requests', '1');
            proxyReq.setHeader('Sec-Fetch-Dest', 'document');
            proxyReq.setHeader('Sec-Fetch-Mode', 'navigate');
            proxyReq.setHeader('Sec-Fetch-Site', 'none');
            proxyReq.setHeader('Cache-Control', 'max-age=0');
          });
        },
      },
    },
  },
})
