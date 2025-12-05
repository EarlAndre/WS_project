import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy `/api` to Django backend during local development.
      // Use 127.0.0.1 to avoid potential hostname resolution issues.
      '/api': {
        // Use explicit IPv4 address to avoid IPv6/localhost resolution mismatches
        // on some Windows setups which can cause ECONNREFUSED from the proxy.
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
})
