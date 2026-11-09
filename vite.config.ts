import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/kitayar-dashboard/',
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'classroom-redirect-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/classroom/') || req.url.startsWith('/classroom?'))) {
            res.writeHead(302, { Location: `/kitayar-dashboard${req.url}` })
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
})
